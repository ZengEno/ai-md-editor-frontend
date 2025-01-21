# AI Article Editor

## Project Overview

This is a web-based markdown editor designed for academic writing and research. It features a workspace system that supports both editable workspace files and read-only reference materials, with version control capabilities.

## Key Features

### Workspace Management

-   Supports a structured workspace with distinct areas:
    -   Root directory for active working files
    -   `references/` folder for read-only reference materials
    -   `images/` folder for storing images
    -   `versions/` folder for version history
-   Each reference can have its own images in a dedicated subfolder

### File Operations

-   Create new markdown files
-   Rename files (automatically updates associated versions)
-   Delete files
-   Read-only mode for reference materials

### Editor Features

-   Split-view markdown editor with live preview
-   Mathematical expression support using KaTeX
-   Image support with automatic loading from appropriate folders
-   Heading level support (H1-H4)
-   Text selection synchronization between editor and preview
-   Table support with GitHub Flavored Markdown remark-gfm
-   Responsive table layout with horizontal scrolling

### Version Control

-   Create named versions of files
-   View version history with relative timestamps
-   Revert to previous versions
-   Versions are stored in a dedicated versions folder
-   Version filenames follow the pattern: `[original_filename]-[version_name]-[timestamp].md`
-   Visual diff comparison between versions
-   Fixed header with accept/reject controls
-   Scrollable diff view
-   Auto-show preview when comparing versions
-   Manual save after accepting changes

### UI Features

-   Resizable panels
-   File explorer with separate sections for workspace and reference files
-   Visual indicators for:
    -   Unsaved changes
    -   Read-only files
    -   File types
    -   Version history

### Authentication

-   JWT-based authentication system
-   User registration and login
-   Protected workspace access
-   User profile management
-   Automatic token refresh handling

## Recent Improvements

1. Implemented proper version control system
2. Added mathematical expression support
3. Improved file organization with dedicated folders
4. Enhanced reference file handling
5. Added proper timestamp handling for versions
6. Improved rename functionality to handle version files
7. Added read-only mode for reference materials
8. Added table support with proper styling and formatting
9. Added workspace folder structure initialization
10. Added user confirmation for creating required folders
11. Added visual diff comparison for versions
12. Improved version comparison UX with fixed header
13. Added state persistence for version comparisons
14. Implemented Zustand store for version management
15. Implemented custom hooks for better code organization
16. Added centralized file name validation
17. Added error boundaries for graceful error handling
18. Improved file rename functionality with version handling
19. Added consistent error handling and user feedback

## File Structure

workspace/
├── (markdown files) # Editable workspace files
├── images/ # Workspace images
├── versions/ # Version history
└── references/ # Read-only reference materials
└── [reference_name]/ # Reference-specific folder
└── images/ # Reference-specific images

## Technical Notes

-   Uses the File System Access API for file handling
-   Implements TextEncoder for efficient file writing
-   Uses date-fns for timestamp formatting
-   Implements proper error handling for file operations
-   Uses React with TypeScript for type safety
-   Uses Chakra UI for the interface
-   Uses Monaco Editor for the markdown editing
-   Uses ReactMarkdown with remark-gfm for enhanced markdown support
-   Uses Zustand for version state management
-   Uses Axios for API requests
-   Implements JWT authentication with automatic token refresh
-   Uses diff library for text comparison
-   Implements responsive diff viewer layout
-   Uses custom hooks for state and logic management
-   Implements centralized validation utilities
-   Uses error boundaries for graceful error recovery
-   Implements consistent file naming conventions

## Backend Interaction

### Authentication Flow

-   Uses JWT with access and refresh token mechanism
-   Access token expires in 0.2 minutes (for testing)
-   Refresh token expires in 14 days
-   Automatic token refresh using interceptors
-   Token management separated into dedicated TokenManager class
-   Pre-emptive token expiration check before requests
-   5-second buffer for token expiration
-   Graceful handling of refresh token expiration

### API Endpoints

-   `/login`: POST with form-urlencoded data
-   `/register`: POST with JSON data
-   `/refresh`: GET with refresh token in Authorization header
-   `/logout`: POST with access token
-   `/user/my_info`: GET with access token

### Error Handling

-   401 errors trigger automatic token refresh
-   Failed refresh attempts trigger logout
-   API errors displayed in UI, not console
-   Graceful degradation on network failures

## Future Improvements

1. Add markdown toolbar for common formatting
2. Implement auto-save functionality
3. Add search/filter for reference files
4. Add drag-and-drop support for images
5. Add keyboard shortcuts


## Interaction with AI

When requesting changes or improvements:

1. Specify which component or feature you want to modify
2. Provide context about the current implementation
3. Describe the desired behavior
4. Mention any specific requirements or constraints

Example:
"I want to modify the version control system in Editor.tsx to add support for version tags. The current implementation stores versions with timestamps, but I'd like to add optional tags for better organization."
