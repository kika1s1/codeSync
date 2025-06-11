// Background service worker for handling GitHub API calls
class GitHubService {
  constructor() {
    this.baseURL = 'https://api.github.com';
  }

  async getStoredCredentials() {
    const result = await chrome.storage.local.get(['githubToken', 'githubUsername', 'selectedRepo']);
    return result;
  }

  async pushToGitHub(submission) {
    console.log('Pushing submission to GitHub:', submission);
    
    try {
      const { githubToken, githubUsername, selectedRepo } = await this.getStoredCredentials();
      
      if (!githubToken || !selectedRepo) {
        throw new Error('GitHub credentials or repository not configured');
      }

      const filePath = this.generateFilePath(submission);
      const content = this.prepareFileContent(submission);
      const encodedContent = btoa(unescape(encodeURIComponent(content)));

      console.log('Generated file path:', filePath);
      console.log('Content length:', content.length);

      // Check if file exists
      const fileExists = await this.checkFileExists(githubUsername, selectedRepo, filePath, githubToken);
      
      const payload = {
        message: `Add ${submission.platform}: ${submission.title}`,
        content: encodedContent,
        branch: 'main'
      };

      if (fileExists) {
        payload.sha = fileExists.sha;
        payload.message = `Update ${submission.platform}: ${submission.title}`;
        console.log('File exists, updating...');
      } else {
        console.log('Creating new file...');
      }

      const response = await fetch(`${this.baseURL}/repos/${selectedRepo}/contents/${filePath}`, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${githubToken}`,
          'Content-Type': 'application/json',
          'User-Agent': 'CodeSync-Extension'
        },
        body: JSON.stringify(payload)
      });
      

      if (!response.ok) {
        const errorData = await response.json();
        console.error('GitHub API error:', errorData);
        console.log("fuck you ",selectedRepo, githubUsername, filePath, payload);
        throw new Error(`GitHub API error: ${response.status} - ${errorData.message}` || 'Unknown error');
      }

      const result = await response.json();
      console.log('GitHub push successful:', result);
      
      // Show success notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon-48.png',
        title: 'CodeSync Success',
        message: `${submission.title} pushed to GitHub successfully!`
      });

      // Store in submission history
      await this.addToHistory(submission, result.content.html_url);
      
      return result;
    } catch (error) {
      console.error('GitHub push error:', error);
      
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon-48.png',
        title: 'CodeSync Error',
        message: `Failed to push ${submission.title}: ${error.message}`
      });
      
      throw error;
    }
  }

  generateFilePath(submission) {
    const sanitize = (str) => str.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
    
    const getExtension = (lang) => {
      const extensions = {
        'cpp': 'cpp', 'c++': 'cpp', 'c++17': 'cpp', 'c++20': 'cpp', 'gnu c++': 'cpp',
        'python': 'py', 'python3': 'py', 'pypy': 'py', 'pypy3': 'py',
        'java': 'java',
        'javascript': 'js', 'node.js': 'js',
        'go': 'go',
        'rust': 'rs',
        'c': 'c',
        'c#': 'cs', 'csharp': 'cs'
      };
      return extensions[lang.toLowerCase()] || 'txt';
    };

    if (submission.platform === 'leetcode') {
      const difficulty = submission.difficulty || 'medium';
      const title = sanitize(submission.title);
      const ext = getExtension(submission.language);
      return `leetcode/${difficulty}/${title}.${ext}`;
    } else if (submission.platform === 'codeforces') {
      const contest = submission.contestId;
      const division = submission.division || 'div2';
      const problem = submission.problemIndex.toLowerCase();
      const ext = getExtension(submission.language);
      return `codeforces/${division}/contest_${contest}/${problem}.${ext}`;
    }
    
    const title = sanitize(submission.title);
    const ext = getExtension(submission.language);
    return `${submission.platform}/${title}.${ext}`;
  }

  prepareFileContent(submission) {
    console.log("this is prepareFileContent", submission);
    const timestamp = new Date().toISOString();
    const problemUrl = submission.url || '';
    
    let header = `/*\n * ${submission.title}\n`;
    header += ` * Platform: ${submission.platform.toUpperCase()}\n`;
    if (submission.difficulty) header += ` * Difficulty: ${submission.difficulty}\n`;
    if (submission.contestId) header += ` * Contest: ${submission.contestId}\n`;
    if (submission.problemIndex) header += ` * Problem: ${submission.problemIndex}\n`;
    if (submission.language) header += ` * Language: ${submission.language}\n`;
    if (problemUrl) header += ` * Problem URL: ${problemUrl}\n`;
    header += ` * Date: ${timestamp}\n`;
    header += ` * Author: CodeSync Extension\n */\n\n`;
    
    return header + submission.code;
  }

  async checkFileExists(username, repo, path, token) {
    try {
      const response = await fetch(`${this.baseURL}/repos/${username}/${repo}/contents/${path}`, {
        headers: {
          'Authorization': `token ${token}`,
          'User-Agent': 'CodeSync-Extension'
        }
      });
      
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.log('File does not exist:', path);
      return null;
    }
  }

  async addToHistory(submission, githubUrl) {
    const history = await chrome.storage.local.get(['submissionHistory']);
    const historyList = history.submissionHistory || [];
    
    historyList.unshift({
      ...submission,
      githubUrl,
      timestamp: Date.now()
    });
    
    // Keep only last 100 submissions
    if (historyList.length > 100) {
      historyList.splice(100);
    }
    
    await chrome.storage.local.set({ submissionHistory: historyList });
    console.log('Added to history:', submission.title);
  }

  async testGitHubConnection(token) {
    try {
      const response = await fetch(`${this.baseURL}/user`, {
        headers: {
          'Authorization': `token ${token}`,
          'User-Agent': 'CodeSync-Extension'
        }
      });

      if (!response.ok) {
        throw new Error('Invalid GitHub token');
      }

      return await response.json();
    } catch (error) {
      console.error('GitHub connection test failed:', error);
      throw error;
    }
  }
}

const githubService = new GitHubService();

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request);
  console.log(request.type, request.data);

  
  if (request.type === 'submission') {
    githubService.pushToGitHub(request.data)
      .then(result => {
        console.log('Push successful:', result);
        sendResponse({ success: true, result });
      })
      .catch(error => {
        console.error('Push failed:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep message channel open for async response
  }
  
  if (request.type === 'test-github-auth') {
    githubService.getStoredCredentials()
      .then(async ({ githubToken }) => {
        if (!githubToken) {
          throw new Error('No GitHub token found');
        }
        
        const user = await githubService.testGitHubConnection(githubToken);
        sendResponse({ success: true, user });
      })
      .catch(error => {
        console.error('Auth test failed:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }
});

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('CodeSync extension installed');
});