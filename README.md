# SecureBoot Status Check

[![Python](https://img.shields.io/badge/python-3.6+-blue.svg)](https://www.python.org/)
[![JavaScript](https://img.shields.io/badge/javascript-ES6+-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

A comprehensive web application for checking SecureBoot status and analyzing system vulnerabilities related to the Black Hat USA 2025 research "Booting into Breaches: Hunting Windows SecureBoot's Remote Attack Surfaces".

## 🎯 Project Overview

This project helps users check if their systems are affected by the 32 SecureBoot vulnerabilities discovered by Azure Yang and patched in 2024. The tool collects anonymous data for presentation in the final Black Hat talk and provides detailed analysis of SecureBoot configurations.

## 🏗️ Architecture

```
sbootbreaches.github.io/
├── frontend/                 # Web application
│   ├── index.html           # Main page
│   ├── ui.js               # Frontend logic
│   ├── styles.css          # Styling
│   ├── fonts.css           # Font definitions
│   └── locales/            # Translation files
├── backend/                 # Server and analysis tools
│   ├── server.js           # Cloudflare Worker
│   ├── flag_analyzer.py    # Data analysis script
│   └── flag_analysis.png   # Generated visualization
├── scripts/                 # Utility scripts
│   ├── linux.py           # Linux SecureBoot checker
│   └── fetch.ps1          # PowerShell data fetcher
└── assets/                  # Static assets
    ├── fonts/             # Custom fonts
    └── cveinfo.csv        # CVE information
```

## 📊 Data Analysis

### Flag Structure

The data collect backend uses a 4-bit flag to represent SecureBoot status:

```javascript
const flag = (secureBootEnabled ? 1 : 0) | 
             (dbHex.includes(WIN_PCA_2011_CERT) ? 1 : 0) << 1 | 
             (dbxHex.includes(WIN_PCA_2011_CERT) ? 1 : 0) << 2 | 
             (dbHex.includes(WIN_PCA_2023_CERT) ? 1 : 0) << 3;
```

- **Bit 0**: SecureBoot Enabled/Disabled
- **Bit 1**: WIN_PCA_2011_CERT in DB
- **Bit 2**: WIN_PCA_2011_CERT in DBX  
- **Bit 3**: WIN_PCA_2023_CERT in DB

## 🔧 Collect backend API Endpoints

### POST `/` (Main endpoint)
- **Purpose**: Submit SecureBoot analysis data
- **Authentication**: None required
- **Data**: JSON with timestamp, OS info, flag, and system data

### GET `/`
- **Purpose**: Retrieve all collected data
- **Authentication**: Passcode required (`?passcode=YOUR_PASSCODE`)
- **Response**: JSON with total entries and detailed data

## 🌍 Internationalization

The application supports 10 languages:

- 🇺🇸 English
- 🇪🇸 Español  
- 🇨🇳 简体中文
- 🇯🇵 日本語
- 🇹🇼 繁體中文
- 🇩🇪 Deutsch
- 🇫🇷 Français
- 🇷🇺 Русский
- 🇰🇷 한국어
- 🇸🇦 العربية

Translation files are located in `locales/` directory.

## 📈 Data Visualization

Collected data on 2025/07/30
![](/backend/flag_analysis.png)