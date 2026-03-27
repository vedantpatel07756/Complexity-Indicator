# Changelog

All notable changes to **Complexity Indicator** are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/).

---

## [0.0.3] – 2026-03-27

### Added
- Expanded file-type compatibility — supports a wider range of languages beyond Dart/Flutter

---

## [0.0.2] – 2026-03-20

### Added
- Marketplace icon (`assets/icon.png`)

### Changed
- Updated `package.json` metadata (publisher, repository, homepage, bugs URL)

---

## [0.0.1] – 2026-03-15

### Added
- Initial release
- Sidebar panel with real-time complexity metrics dashboard
- **Complexity Score** (0–100) weighted from Cyclomatic Complexity, Max Nesting Depth, LOC, Average Parameters, and Function Count
- **Maintainability Index** based on the Microsoft formula
- **Lines of Code** — counts only executable lines (excludes blanks and comments)
- **Function Count** — total function/method declarations
- **Cyclomatic Complexity** — independent execution paths (McCabe)
- **Max Nesting Depth** — deepest nested control-flow level
- **Average Parameters** — average parameters per function
- **Comment Ratio** — percentage of lines that are comments
- **Import Count** — total import statements
- Status bar badge showing the current complexity label (Low / Medium / High / Very High / Critical)
- Info tooltips (ⓘ) on each metric card explaining the metric and healthy thresholds
- Live updates on file save, type, and tab switch
- Startup bug fix — extension now activates reliably on `onStartupFinished`

---
