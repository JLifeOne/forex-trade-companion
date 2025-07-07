# Gemini Project Context: forex-trade-companion

This document provides context for the "forex-trade-companion" project to facilitate efficient and accurate assistance.

## Project Overview

A comprehensive dashboard for Forex traders, featuring session tracking, journaling, analytics, AI-powered insights, and community features. It helps traders stay organized, analyze performance, and make informed decisions. This is a static web application that can be run by opening the `index.html` file in a web browser.

Very important. Before begining any work you must analyze the full root directory, frontend and backend layout to understand the layout in a full-scope comprehensive manner. Use `type` and `ls`.
Always Identify potential issues that could be causing errors or warnings (the "red and yellow squiggles") in folders/files and design a comprehensive fix according to your good work habits.
Successfully compile the proper codes and ensuring the application remains stable.

Do not assume. please double and triple check to ensure that your assumptions are true.
Use `type` to read and view files thruought.

Always double check to ensure paths are correct.

THESE ARE YOUR WORK-HABITS (YOU MUST ADHERE TO) Do not forget them.
  1.Do not delete as an approach a problem. Search for the problem fix. (For E.g. Make unused vars useful for the users. Check for proper import paths where necessary. Fix inline styling with proper syntax for the app.)
Evidence-Based Development:
       * Habit: No assumptions. Always start by gathering data with read_file and list_directory.
         Verify the problem with evidence before proposing a solution.
Do not delete unused vars
Check to see if it a symptom. If true check for root cause and do a thorough fix.
Do not break the app.

Errors to watch for:
Paths imports/Exports
Syntax Errors
Indents and spacing
Always address and fix npm warns
Always run npm fix

   2.Holistic, System-Level Debugging:
       *Habit: I will not focus on individual errors. I will always take a step back to find
         the root cause. This includes:
           * Actively asking for and analyzing all VSCode Highlighted Problems to get a complete,
             IDE-level picture of the issues.
           * Analyzing the relationships between all reported errors (from VSCode, linters, and
             compilers) to form a single, comprehensive diagnosis.

   3.Efficient, Multi-pass Error Resolution:
       *New Habit: I will use a "narrowing" strategy to fix errors efficiently.
           * Pass 1 (Automatic Fix): Always use the --fix option with the linter first. This
             automatically clears away all the simple, stylistic noise (like indentation and
             quotes).
           *Pass 2 (Holistic Analysis): Analyze the much smaller, remaining list of important errors to identify the root cause.
           * Pass 3 (Resourceful Implementation): Fix the root cause, which will resolve the remaining errors as a natural consequence.

   4.Resourceful Implementation of "Unused" Variables (Upgraded):
       *Work Habit: I will never simply delete an "unused" variable. I will treat it as a bug or an
         unimplemented feature. My process will be:
           * Analyze Intent: Understand what the variable was supposed to do.
           *Consult Blueprint: Cross-reference with PRD.txt and Gemini.log.
           * Propose Resourceful Feature: Propose a fix that implements the intended functionality
             in a way that is beneficial to all three user personas: experienced, intermediate, and
             new traders. I will explicitly state how the fix helps each one.

   5.Proactive, Context-Aware Feature Improvement:
       *Work Habit: I will not just build features in isolation. For any feature I am working on, I will:
           * Analyze Connections: Have a full understanding of how it relates to and impacts other
             existing or future features.
           * Suggest Upgrades: Proactively suggest improvements and integrations that would make
             the feature more powerful and the overall product more cohesive and resourceful for
             the user.

   6.Rigorous Verification at Every Step:
       * Habit: After every file modification, I will (1) Read the file back, and (2) Run a syntax error check
         check on that specific file before proceeding.

   7.Blueprint-Driven Development:
       * Habit: Always consult PRD.txt and GEMINI.md to ensure strategic alignment.

   8.Persistent Progress Logging:
       *Habit: Maintain a detailed log in Gemini.log to track our progress, decisions, our why, and next
         steps. Do not delete contents logged previously only amend the file with new updated data. I will maintain a detailed, human-readable progress log in Gemini.log. This will capture
         the "why" behind our decisions and will serve as our roadmap for future work.
       * Result: This will ensure that we can always resume our work efficiently and with full context, and it
         will prevent the kind of "hallucinations" that have plagued our previous efforts.

  ---
-## Tech Stack
-**Frontend:** React, TypeScript, Redux
-**Styling:** (Not specified, but likely CSS/Sass/Styled-components)
-**Data Fetching:** Axios
-**Charting:** Recharts
-**Date/Time:** Day.js, Moment.js
-**Backend (BaaS):** Firebase (Authentication, Firestore, Hosting)
-**AI:** Google Gemini

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
