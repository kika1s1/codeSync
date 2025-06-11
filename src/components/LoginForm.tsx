import React, { useState } from 'react';
import { Github, Key, Loader, ExternalLink } from 'lucide-react';

interface Repository {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
}

interface User {
  login: string;
  name: string;
  avatar_url: string;
}

interface LoginFormProps {
  onLogin: (user: User, repo: string) => void;
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'token' | 'repo'>('token');
  const [user, setUser] = useState<User | null>(null);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState('');

  const handleTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      // Test the token and get user info
      const userResponse = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${token}`
        }
      });

      if (!userResponse.ok) {
        throw new Error('Invalid GitHub token');
      }

      const userData = await userResponse.json();
      setUser(userData);

      // Get user repositories
      const reposResponse = await fetch('https://api.github.com/user/repos?sort=updated&per_page=50', {
        headers: {
          'Authorization': `token ${token}`
        }
      });

      if (!reposResponse.ok) {
        throw new Error('Failed to fetch repositories');
      }

      const reposData = await reposResponse.json();
      setRepositories(reposData);
      setStep('repo');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRepoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRepo || !user) return;

    setIsLoading(true);

    try {
      // Store credentials
      await chrome.storage.local.set({
        githubToken: token,
        githubUsername: user.login,
        selectedRepo: selectedRepo
      });

      onLogin(user, selectedRepo);
    } catch (err) {
      setError('Failed to save credentials');
      setIsLoading(false);
    }
  };

  const createNewRepo = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const response = await fetch('https://api.github.com/user/repos', {
        method: 'POST',
        headers: {
          'Authorization': `token ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: 'leetcode-solutions',
          description: 'My LeetCode and Codeforces solutions',
          private: false,
          auto_init: true
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create repository');
      }

      const newRepo = await response.json();
      setSelectedRepo(newRepo.full_name);
      
      // Add to repositories list
      setRepositories(prev => [newRepo, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create repository');
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'repo') {
    return (
      <div className="w-80 h-96 bg-white flex flex-col">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
          <div className="flex items-center space-x-2">
            <Github className="w-5 h-5" />
            <span className="font-semibold">Select Repository</span>
          </div>
        </div>

        <div className="flex-1 p-4 overflow-y-auto">
          <form onSubmit={handleRepoSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Choose a repository for your solutions:
              </label>
              <select
                value={selectedRepo}
                onChange={(e) => setSelectedRepo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select a repository...</option>
                {repositories.map(repo => (
                  <option key={repo.id} value={repo.full_name}>
                    {repo.name} {repo.private ? '(Private)' : '(Public)'}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={createNewRepo}
              className="w-full py-2 px-4 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center space-x-2"
              disabled={isLoading}
            >
              <Github className="w-4 h-4" />
              <span>Create New Repository</span>
            </button>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={!selectedRepo || isLoading}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Github className="w-4 h-4" />
              )}
              <span>{isLoading ? 'Setting up...' : 'Complete Setup'}</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 h-96 bg-white flex flex-col">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
        <div className="flex items-center space-x-2">
          <Github className="w-5 h-5" />
          <span className="font-semibold">CodeSync Setup</span>
        </div>
        <p className="text-blue-100 text-sm mt-1">Connect your GitHub account</p>
      </div>

      <div className="flex-1 p-4 flex flex-col justify-center">
        <form onSubmit={handleTokenSubmit} className="space-y-4">
          <div>
            <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-2">
              GitHub Personal Access Token
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="password"
                id="token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-700 mb-2">
              Need a token? 
              <a 
                href="https://github.com/settings/tokens/new?scopes=repo&description=CodeSync%20Extension"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline ml-1 inline-flex items-center"
              >
                Create one here
                <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </p>
            <p className="text-xs text-blue-600">
              Required scope: <code className="bg-blue-100 px-1 rounded">repo</code>
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={!token.trim() || isLoading}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <Github className="w-4 h-4" />
            )}
            <span>{isLoading ? 'Connecting...' : 'Connect GitHub'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}