# CodeSync Chrome Extension

## Overview

CodeSync is a Chrome extension that automatically synchronizes your accepted LeetCode and Codeforces submissions to a designated GitHub repository. With smart organization by platform, difficulty, and contest, CodeSync streamlines your coding workflow and preserves your problem-solving history.

## Features

- 🔄 **Automatic Detection**: Monitors LeetCode and Codeforces for accepted submissions.
- 📁 **Smart Organization**: Categorizes solutions by platform, difficulty level, and contest.
- 🔐 **Secure Authentication**: Uses GitHub Personal Access Tokens (stored locally) for secure access.
- 📊 **Interactive Dashboard**: View sync status, submission history, and analytics.
- ⚙️ **Customizable Settings**: Configure repository, file structure, and notifications.
- 🎨 **Modern UI**: Built with React, TypeScript, and Tailwind CSS for a clean user experience.

## Technology Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Build Tool**: Vite
- **Extension Platform**: Chrome Manifest V3
- **API**: GitHub REST API
- **Icons**: Lucide React

## Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/<your-username>/CodeSync.git
   cd CodeSync
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Build the extension**:
   ```bash
   npm run build
   ```
4. **Load in Chrome**:
   - Navigate to `chrome://extensions/`
   - Enable **Developer mode**
   - Click **Load unpacked** and select the `dist` folder

## Configuration

1. Generate a GitHub Personal Access Token with **repo** scope.
2. Open the CodeSync extension in Chrome.
3. Paste your token when prompted.
4. Select an existing repository or create a new one for your solutions.

## Usage

1. Solve problems on LeetCode or Codeforces in your browser.
2. Upon acceptance, CodeSync detects the submission and automatically syncs it to GitHub.
3. Monitor upload status and review past submissions in the extension dashboard.

## File Organization

By default, CodeSync organizes files in the following structure:

```
leetcode/
├── easy/
├── medium/
└── hard/

codeforces/
├── div1/
├── div2/
└── div3/
```

Each directory contains files named by problem and language extension.

## Development

To run the development environment:

```bash
npm run dev
```

Additional scripts:

- `npm run build`: Build the production extension
- `npm run lint`: Run linter to enforce code quality

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/YourFeature`)
3. Commit your changes (`git commit -m 'Add YourFeature'`)
4. Push to the branch (`git push origin feature/YourFeature`)
5. Open a pull request for review

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.