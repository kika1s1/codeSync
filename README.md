# CodeSync Chrome Extension

Automatically sync your accepted LeetCode and Codeforces submissions to GitHub with proper file organization.

## Features

- 🔄 **Automatic Detection**: Detects accepted submissions on LeetCode and Codeforces
- 📁 **Smart Organization**: Organizes files by platform, difficulty, and contest
- 🔐 **Secure**: Uses GitHub Personal Access Tokens for authentication
- 📊 **Dashboard**: View sync status and submission history
- 🎨 **Modern UI**: Clean, professional interface built with React

## Installation

1. Clone this repository
2. Run `npm install`
3. Run `npm run build`
4. Load the `dist` folder as an unpacked extension in Chrome

## Setup

1. Create a GitHub Personal Access Token with `repo` scope
2. Install and open the extension
3. Enter your GitHub token
4. Select or create a repository for your solutions
5. Start solving problems!

## File Organization

### LeetCode
```
leetcode/
├── easy/
│   ├── two_sum.cpp
│   └── valid_parentheses.py
├── medium/
│   ├── add_two_numbers.cpp
│   └── longest_substring.js
└── hard/
    └── median_of_two_sorted_arrays.cpp
```

### Codeforces
```
codeforces/
├── div1/
│   └── contest_1234/
│       ├── a.cpp
│       └── b.py
├── div2/
│   └── contest_1235/
│       ├── a.cpp
│       ├── b.cpp
│       └── c.java
└── div3/
    └── contest_1236/
        └── a.py
```

## Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS
- **Build Tool**: Vite
- **Extension**: Chrome Manifest V3
- **API**: GitHub REST API
- **Icons**: Lucide React

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build extension
npm run build

# Lint code
npm run lint
```

## Permissions

- `storage`: Store user preferences and submission history
- `activeTab`: Access current tab for content script injection
- `notifications`: Show sync status notifications
- `scripting`: Inject content scripts for submission detection

## Security

- GitHub tokens are stored locally using Chrome's storage API
- No data is sent to external servers except GitHub
- All API calls are made directly to GitHub's official API

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details