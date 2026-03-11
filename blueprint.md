# Dog Walking App - A.I. Coach

## Overview

This application is an "A.I. coach that helps dogs live a healthy life." It will be a mobile-friendly web application built with React and Firebase, designed with a clean and scalable architecture to eventually become a native mobile app.

## Feature: Walk Record System

The initial feature is a system for users to record their dog's walks and view their history.

### Data Structure (Firestore)

Walk records are stored in a `walks` subcollection for each user.

-   **Collection:** `users/{userId}/walks`
-   **Document:** `{walkId}`
    -   `date` (Timestamp): The date of the walk.
    -   `distance` (number): Walking distance in kilometers.
    -   `duration` (number): Walking duration in seconds.
    -   `condition` (string): A note about the dog's condition.
    -   `routeCoordinates` (Array<GeoPoint>): An array of GPS coordinates.
    -   `createdAt` (Timestamp): The timestamp when the record was created.

### Screens

1.  **Home Page (Main Page) (`/`)**
    -   Dominant map display showing the user's current location.
    -   "Start Walk" button at the bottom.
    -   Navigation to Profile and Calendar pages.

2.  **Profile Page (`/profile`)**
    -   Displays user's basic profile (nickname, profile image).
    -   Displays dog's information (name, age, breed, profile picture).
    -   Simple walk statistics (total walks, total distance).
    -   "Edit Profile" button.

3.  **Calendar Page (`/calendar`)**
    -   Displays a calendar interface.
    -   Visually marks dates that have one or more walk records.
    -   Users can click on a date to view the walk(s) for that day.
    -   Provides navigation to the Walk Recording Screen.

4.  **Walk Recording Screen (`/walk`)**
    -   Allows users to start, pause, and end a walk.
    -   Tracks GPS location, calculates distance, and measures duration in real-time.
    -   Upon completion, saves the walk data to Firestore.

5.  **Walk Detail Screen (`/walk/:id`)**
    -   Shows detailed information for a single walk, including date, distance, duration, and the owner's note.
    -   Displays a map with the recorded GPS route drawn as a path.

### Code Architecture

The project follows a standard React project structure, separating concerns into different directories:

-   `/src/components`: Reusable UI components (e.g., `Map`, `Layout`, `BottomNavigation`).
-   `/src/screens`: Top-level screen components corresponding to different routes (`HomePage`, `ProfileScreen`, `CalendarPage`, `WalkScreen`, `WalkDetailScreen`).
-   `/src/services`: Modules for interacting with external services like Firestore.
-   `/src/utils`: Helper functions and utilities (e.g., for geolocation, calculations).

### UI/UX

-   **Layout:** Centered, mobile-first design with a maximum width = 500px for a consistent, app-like feel.
-   **Design:** Simple, modern, and clean aesthetics.
-   **Responsiveness:** The layout adapts to different screen sizes.
-   **Navigation:** Persistent bottom navigation bar for main app sections.

---

## Current Task: Initial Implementation

**Objective:** Build the complete "Walk Record System" feature as described above.

**Steps:**

1.  [x] Install necessary dependencies (`firebase`, `react-router-dom`, `react-calendar`, `leaflet`, `react-leaflet`, `haversine-distance`).
2.  [x] Install Google Maps dependencies (`@react-google-maps/api`, `@googlemaps/js-api-loader`).
3.  [x] Configure Firebase and create the `firestore.ts` service.
4.  [x] Set up the basic folder structure (`components`, `screens`, `services`, `utils`).
5.  [x] Implement the `walkService` to handle all Firestore operations.
6.  [x] Create utility functions for geolocation, distance calculation, and time formatting.
7.  [x] Create `BottomNavigation.tsx` for app-wide navigation.
8.  [x] Modify `Layout.tsx` and `Layout.css` to integrate `BottomNavigation` and adjust padding.
9.  [x] Update `App.tsx` with routing for `/`, `/profile`, `/calendar`, `/walk`, `/walk/:walkId`.
10. [x] Refactor `CalendarScreen.tsx` to `CalendarPage.tsx` and update its component name and CSS import.
11. [x] Develop `HomePage.tsx` and `HomePage.css` for the main map-based screen.
12. [x] Develop `ProfileScreen.tsx` and `ProfileScreen.css` for the profile display.
13. [x] Apply styling to ensure the UI is clean, modern, and mobile-friendly.
