class CodeforcesDetector {
  constructor() {
    this.isProcessing = false;
    this.lastProcessedSubmission = null;
    this.init();
  }

  init() {
    console.log('Codeforces detector initialized');
    this.observePageChanges();
    this.checkCurrentPage();
  }

  observePageChanges() {
    let currentUrl = window.location.href;
    const observer = new MutationObserver(() => {
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        this.checkCurrentPage();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  checkCurrentPage() {
    if (this.isStatusPage()) {
      this.watchForAcceptedSubmission();
    } else if (this.isSubmissionPage()) {
      this.handleSingleSubmissionPage();
    }
  }

  isStatusPage() {
    const p = window.location.pathname;
    return p.includes('/status') || p.includes('/my') || p.includes('/submissions');
  }

  isSubmissionPage() {
    return /\/submission\/\d+/.test(window.location.pathname);
  }

  watchForAcceptedSubmission() {
    const interval = setInterval(() => {
      if (this.isProcessing) return;
      const row = this.findAcceptedSubmission();
      if (row) this.handleAcceptedSubmission(row);
    }, 3000);

    setTimeout(() => clearInterval(interval), 120000);
  }

  findAcceptedSubmission() {
    const rows = document.querySelectorAll('tr');
    for (let row of rows) {
      const cells = row.querySelectorAll('td');
      if (cells.length < 4) continue;

      let hasAccepted = false;
      let isRecent = false;

      for (let cell of cells) {
        const text = cell.textContent.trim();
        if (text.includes('Accepted')) hasAccepted = true;
        if (this.isRecentSubmission(text)) isRecent = true;
      }

      if (hasAccepted && isRecent) return row;
    }

    return Array.from(rows).slice(-10).find(r => r.textContent.includes('Accepted'));
  }

  isRecentSubmission(text) {
    const keywords = ['just now', 'seconds ago', '1 minute ago', 'минуту назад'];
    return keywords.some(k => text.toLowerCase().includes(k));
  }

  async handleAcceptedSubmission(row) {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const submission = await this.extractSubmissionData(row);
      if (!this.isNewSubmission(submission)) return;

      this.lastProcessedSubmission = submission;

      chrome.runtime.sendMessage({ type: 'submission', data: submission }, res => {
        if (res?.success) this.showSuccessNotification(submission.title);
        else console.error('Sync failed:', res?.error);
        this.isProcessing = false;
      });

    } catch (err) {
      console.error('Failed to handle accepted submission:', err);
      this.isProcessing = false;
    }
  }

  async handleSingleSubmissionPage() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const sid = window.location.pathname.match(/\/submission\/(\d+)/)[1];
      const code = await this.fetchSubmissionCode(sid);
      const problemInfo = this.extractProblemFromCurrentPage();
      const language = this.detectLanguageFromPage();

      const submission = {
        platform: 'codeforces',
        title: problemInfo.title,
        contestId: problemInfo.contestId,
        problemIndex: problemInfo.problemIndex,
        division: problemInfo.division,
        language: language || 'cpp',
        code,
        url: window.location.href,
        timestamp: Date.now()
      };

      chrome.runtime.sendMessage({ type: 'submission', data: submission }, res => {
        if (res?.success) this.showSuccessNotification(submission.title);
        else console.error('Sync failed:', res?.error);
        this.isProcessing = false;
      });

    } catch (err) {
      console.error('Error in individual submission page:', err);
      this.isProcessing = false;
    }
  }

  async extractSubmissionData(row) {
    const cells = row.querySelectorAll('td');
    let sid = null;
    let pi = null;

    cells.forEach(cell => {
      const sidLink = cell.querySelector('a[href*="/submission/"]');
      if (sidLink) sid = sidLink.href.split('/').pop();

      const problemLink = cell.querySelector('a[href*="/problem/"], a[href*="/contest/"]');
      if (problemLink && !pi) {
        pi = this.parseProblemInfo(problemLink.href, problemLink.textContent);
      }
    });

    if (!pi) pi = this.extractProblemFromCurrentPage();
    const code = await this.fetchSubmissionCode(sid);

    return {
      platform: 'codeforces',
      title: pi.title,
      contestId: pi.contestId,
      problemIndex: pi.problemIndex,
      division: pi.division,
      language: this.detectLanguageFromPage() || 'cpp',
      code,
      url: sid ? `https://codeforces.com/contest/${pi.contestId}/submission/${sid}` : window.location.href,
      timestamp: Date.now()
    };
  }

  parseProblemInfo(href, text) {
    let contestMatch = href.match(/contest\/(\d+)/);
    let problemMatch = href.match(/problem\/([A-Z]\d?)/);

    if (!contestMatch || !problemMatch) {
      contestMatch = href.match(/problemset\/problem\/(\d+)/);
      problemMatch = href.match(/problemset\/problem\/\d+\/([A-Z]\d?)/);
    }

    if (!contestMatch || !problemMatch) {
      throw new Error('Invalid problem URL');
    }

    return {
      contestId: contestMatch[1],
      problemIndex: problemMatch[1],
      division: this.guessDivision(contestMatch[1]),
      title: text.trim()
    };
  }

  extractProblemFromCurrentPage() {
    const match = window.location.pathname.match(/\/contest\/(\d+)\/submission\/\d+/);
    const contestId = match ? match[1] : '';
    const heading = document.querySelector('.problem-statement .title')?.textContent.trim()
                    || document.querySelector('div.title')?.textContent.trim();
    const problemIndex = heading?.split(/\s+/)[0];

    return {
      contestId,
      problemIndex,
      division: this.guessDivision(contestId),
      title: heading || `Problem ${problemIndex}`
    };
  }

  guessDivision(contestId) {
    const id = parseInt(contestId);
    return id >= 1900 ? 'div1' : id >= 1200 ? 'div2' : 'div3';
  }

  detectLanguageFromPage() {
    const text = document.body.innerText.toLowerCase();
    if (text.includes('c++')) return 'cpp';
    if (text.includes('java')) return 'java';
    if (text.includes('python')) return 'python';
    if (text.includes('go')) return 'go';
    if (text.includes('rust')) return 'rust';
    if (text.includes('javascript')) return 'javascript';
    return null;
  }

  async fetchSubmissionCode(sid) {
    if (!sid) return '// No submission ID';
    const html = await (await fetch(`https://codeforces.com/contest/${window.location.pathname.split('/')[2]}/submission/${sid}`)).text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const codeBlock = doc.querySelector('pre#program-source-text') || doc.querySelector('pre');
    return codeBlock?.textContent.trim() || '// Unable to extract code';
  }

  isNewSubmission(sub) {
    if (!this.lastProcessedSubmission) return true;
    return sub.contestId !== this.lastProcessedSubmission.contestId ||
           sub.problemIndex !== this.lastProcessedSubmission.problemIndex ||
           Math.abs(sub.timestamp - this.lastProcessedSubmission.timestamp) > 10000;
  }

  showSuccessNotification(title) {
    const n = document.createElement('div');
    Object.assign(n.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: '#22c55e',
      color: '#fff',
      padding: '12px 20px',
      borderRadius: '6px',
      zIndex: 9999,
      fontFamily: 'system-ui'
    });
    n.textContent = `✅ ${title} synced to GitHub`;
    document.body.appendChild(n);
    setTimeout(() => n.remove(), 4000);
  }
}

// Initialize
new CodeforcesDetector();
