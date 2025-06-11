  // LeetCode submission detector
  class LeetCodeDetector {
    constructor() {
      this.isProcessing = false;
      this.lastProcessedSubmission = null;
      this.init();
    }

    init() {
      console.log('LeetCode detector initialized');
      // Watch for navigation changes in SPA
      this.observePageChanges();
      this.checkCurrentPage();
    }

    observePageChanges() {
      // Watch for URL changes
      let currentUrl = window.location.href;
      const urlObserver = new MutationObserver(() => {
        if (window.location.href !== currentUrl) {
          currentUrl = window.location.href;
          console.log('LeetCode page changed:', currentUrl);
          this.checkCurrentPage();
        }
      });
      
      urlObserver.observe(document.body, { childList: true, subtree: true });

      // Watch for DOM changes that might indicate submission results
      const resultObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Check for accepted status in new nodes
              if (this.containsAcceptedStatus(node)) {
                console.log('Accepted status detected in new node');
                this.handlePotentialAcceptedSubmission();
              }
            }
          });
        });
      });

      resultObserver.observe(document.body, { 
        childList: true, 
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'data-state']
      });
    }

    checkCurrentPage() {
      if (this.isProblemPage()) {
        console.log('On LeetCode problem page, watching for submissions');
        this.watchForAcceptedSubmission();
      }
    }

    isProblemPage() {
      return window.location.pathname.includes('/problems/') && 
            !window.location.pathname.includes('/submissions/');
    }

    containsAcceptedStatus(element) {
      const text = element.textContent || '';
      const className = element.className || '';
      
      return (text.includes('Accepted') || text.includes('Success')) &&
            (className.includes('success') || className.includes('accepted') || 
              className.includes('green') || element.style.color.includes('green'));
    }

    watchForAcceptedSubmission() {
      const checkInterval = setInterval(() => {
        if (this.findAcceptedElement() && !this.isProcessing) {
          console.log('Accepted submission found!');
          this.handlePotentialAcceptedSubmission();
          clearInterval(checkInterval);
        }
      }, 2000);

      // Stop checking after 60 seconds
      setTimeout(() => clearInterval(checkInterval), 60000);
    }

    handlePotentialAcceptedSubmission() {
      if (this.isProcessing) return;
      
      // Wait a bit for the page to fully load the submission details
      setTimeout(() => {
        this.handleAcceptedSubmission();
      }, 3000);
    }

    findAcceptedElement() {
      // Multiple selectors to catch different LeetCode UI versions
      const selectors = [
        '[data-e2e-locator="submission-result"]',
        '.ant-typography',
        '[class*="accepted"]',
        '[class*="success"]',
        '.text-green',
        '[data-cy="submission-result"]',
        '.submission-result',
        '[class*="result"]'
      ];

      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        for (const element of elements) {
          if (element.textContent.includes('Accepted') || element.textContent.includes('Success')) {
            console.log('Found accepted element:', element);
            return element;
          }
        }
      }

      // Fallback: look for any element containing "Accepted"
      const allElements = document.querySelectorAll('*');
      for (const el of allElements) {
        const text = el.textContent?.trim();
        if (text === 'Accepted' && 
            (el.className.includes('green') || el.className.includes('success') || 
            el.style.color.includes('green'))) {
          console.log('Found accepted element (fallback):', el);
          return el;
        }
      }

      return null;
    }

    async handleAcceptedSubmission() {
      if (this.isProcessing) return;
      
      try {
        this.isProcessing = true;
        console.log('Processing accepted submission...');
        
        const submission = await this.extractSubmissionData();
        if (submission && this.isNewSubmission(submission)) {
          console.log('Sending submission to background:', submission);
          this.lastProcessedSubmission = submission;
          
          chrome.runtime.sendMessage({
            type: 'submission',
            data: submission
          }, (response) => {
            console.log('Background response:', response);
            if (response && response.success) {
              console.log('LeetCode submission sent to GitHub successfully');
              this.showSuccessNotification();
            } else {
              console.error('Failed to send submissionrr:', response?.error);
            }
            this.isProcessing = false;
          });
        } else {
          console.log('Submission not new or invalid');
          this.isProcessing = false;
        }
      } catch (error) {
        console.error('Error processing LeetCode submission:', error);
        this.isProcessing = false;
      }
    }

    async extractSubmissionData() {
      // Extract problem title from URL or page
      const urlMatch = window.location.pathname.match(/\/problems\/([^\/]+)/);
      let title = 'Unknown Problem';
      
      if (urlMatch) {
        title = urlMatch[1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      }

      // Try to get title from page elements
      const titleSelectors = [
        '[data-cy="question-title"]',
        'h1',
        '.css-v3d350',
        '[class*="title"]',
        '.question-title'
      ];

      for (const selector of titleSelectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent.trim()) {
          title = element.textContent.trim();
          break;
        }
      }

      // Extract difficulty
      let difficulty = 'medium'; // default
      const difficultySelectors = [
        '[diff]',
        '.css-10o4wqw',
        '[class*="difficulty"]',
        '[data-degree]'
      ];
      
      for (const selector of difficultySelectors) {
        const element = document.querySelector(selector);
        if (element) {
          const text = element.textContent.toLowerCase().trim();
          if (text.includes('easy') || text.includes('hard') || text.includes('medium')) {
            difficulty = text.includes('easy') ? 'easy' : 
                        text.includes('hard') ? 'hard' : 'medium';
            break;
          }
        }
      }

      // Extract language and code
      const { language, code } = await this.extractCodeAndLanguage();

      const url = window.location.href.split('?')[0];

      console.log('Extracted submission data:', { title, difficulty, language, url });

      return {
        platform: 'leetcode',
        title,
        difficulty,
        language,
        code,
        url,
        timestamp: Date.now()
      };
    }

    async extractCodeAndLanguage() {
      let language = 'cpp'; // default
      let code = '';

      // Try to get language from language selector
      const langSelectors = [
        '[data-mode-id]',
        '.language-selector',
        '[aria-label*="language"]',
        '[class*="language"]',
        'button[class*="lang"]'
      ];

      for (const selector of langSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          const text = element.textContent.toLowerCase();
          if (text.includes('python')) language = 'python';
          else if (text.includes('java')) language = 'java';
          else if (text.includes('javascript')) language = 'javascript';
          else if (text.includes('c++') || text.includes('cpp')) language = 'cpp';
          else if (text.includes('go')) language = 'go';
          else if (text.includes('rust')) language = 'rust';
          break;
        }
      }

      // Try to extract code from Monaco editor or code blocks
      const codeSelectors = [
        '.monaco-editor .view-lines',
        'pre code',
        '.language-',
        '[class*="code"]',
        'textarea[class*="code"]',
        '.CodeMirror-code'
      ];

      for (const selector of codeSelectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent.trim()) {
          code = element.textContent.trim();
          break;
        }
      }

      // If no code found, try to get from Monaco editor lines
      if (!code) {
        const lines = document.querySelectorAll('.view-line');
        if (lines.length > 0) {
          code = Array.from(lines).map(line => line.textContent).join('\n');
        }
      }

      // Fallback message if code extraction fails
      if (!code) {
        code = `// Code extraction failed for ${language}\n// Please check the submission manually`;
      }

      console.log('Extracted code and language:', { language, codeLength: code.length });

      return { language, code };
    }

    isNewSubmission(submission) {
      if (!this.lastProcessedSubmission) return true;
      
      return this.lastProcessedSubmission.title !== submission.title ||
            Math.abs(submission.timestamp - this.lastProcessedSubmission.timestamp) > 30000; // 30 seconds
    }

    showSuccessNotification() {
      // Create a temporary notification element
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 10000;
        font-family: system-ui;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      `;
      notification.textContent = '✅ Code synced to GitHub!';
      document.body.appendChild(notification);

      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 3000);
    }
  }

  // Initialize detector
  console.log('Initializing LeetCode detector...');
  new LeetCodeDetector();