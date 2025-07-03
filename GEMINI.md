# Gemini Project Context: forex-trade-companion

This document provides context for the "forex-trade-companion" project to facilitate efficient and accurate assistance.

## Project Overview

A comprehensive dashboard for Forex traders, featuring session tracking, journaling, analytics, AI-powered insights, and community features. It helps traders stay organized, analyze performance, and make informed decisions. This is a static web application that can be run by opening the `index.html` file in a web browser.

## Tech Stack

- **Frontend:** React, TypeScript, Redux
- **Styling:** (Not specified, but likely CSS/Sass/Styled-components)
- **Data Fetching:** Axios
- **Charting:** Recharts
- **Date/Time:** Day.js, Moment.js
- **Backend (BaaS):** Firebase (Authentication, Firestore, Hosting)
- **AI:** Google Gemini

## Project Structure

The project is organized into the following main directories:

- `components/`: Contains reusable React components.
- `services/`: Houses modules for interacting with external services like Firebase, Forex Factory, and Gemini.
- `store/`: Contains Redux Toolkit slices, reducers, and the store setup.
- `utils/`: Includes utility functions for analytics, mock data, and time manipulation.
- `functions/`: Likely contains Firebase Cloud Functions.

## Key Files

- `index.html`: The main entry point for the application.
- `App.tsx`: The root component of the React application.
- `package.json`: Defines project metadata, dependencies, and scripts.
- `firebase.json`: Configuration for Firebase services.
- `vite.config.ts`: Configuration for the Vite build tool.

## How to Run the Application

To run the app, open `index.html` in your browser. Ensure the `API_KEY` environment variable is accessible if running a local dev server that injects it, or that it's manually set if required by your setup.

## Available Commands

- `npm run dev`: Displays instructions on how to run the application.
- `npm start`: Alias for `npm run dev`.
