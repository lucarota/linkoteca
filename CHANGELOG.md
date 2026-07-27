# Changelog

All notable changes to this project will be documented in this file.

## [1.0.2] - 2026-07-27

### Added
- **Public Collections Directory:** Users can now set their collections to public and optionally list them in the new public directory for sharing.
- **Linkstore Import UI:** Introduced a seamless, background migration tool directly within the Settings page to import links from Linkstore.app using an API token.
- **Archived Links Filter:** Added the ability to browse and filter archived links directly from the dashboard.
- **Dashboard Statistics:** Integrated a new stats section in the dashboard showing the total count of active and archived links.

### Changed
- **UI & UX Enhancements:** 
  - Updated the Authentication screen layout for a better user experience.
  - Fixed dashboard loading states to prevent UI flickering.
  - Improved the URL saving flow for faster and more reliable link additions.

## [1.0.1] - 2026-07-27

### Added
- Background metadata fetching using a thread pool executor.
- Onboarding content for users with an empty Dashboard state.
- `.htaccess` configuration for SPA routing and API handling.
- Contribution guidelines, code of conduct, and funding information.
- Credits section for SVG icons in the README.

### Changed
- **Rebranding:** Renamed project to Linkoteca and updated the API URL to use HTTPS.
- **Backend:**
  - Refactored database queries to use `select` and `scalars` for improved performance.
  - Renamed `/api/link` endpoint to `/api/links` and improved filtering capabilities.
  - Excluded `tests` directory from backend deployment scripts.
- **Frontend:**
  - Enhanced URL input handling in the EditScreen.
  - Converted DropdownMenu links to buttons for improved accessibility.
  - Updated various SVG icons for better readability and visual distinction.
  - Fixed button text capitalization in AuthScreen.

## [1.0.0] - 2026-07-24

### Added
- Initial release of Linkoteca: A free reimplementation of linkstore.app.
- Backend implemented with Python.
- Frontend built with React.
- Production-ready deployment setup with `systemd` and `Gunicorn` via an automatic install script.
- Migration script (`migrate_from_linkstore.py`) to seamlessly transfer saved links from Linkstore to Linkoteca using API tokens.
