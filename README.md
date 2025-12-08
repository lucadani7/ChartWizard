# ChartWizard
ChartWizard is a modern web application designed to visualize Body Mass Index (BMI) statistics across European countries. Leveraging data from Eurostat, the application provides an interactive interface for analyzing trends in obesity and underweight rates by country, year, gender, and age group. This document outlines the architectural design, technical implementation, and key features of the application, highlighting its custom SVG-based charting engine and flexible data integration strategies.

## System Architecture
The application is built as a Single Page Application (SPA) using the React framework and TypeScript. It emphasizes a modular component structure and efficient state management to handle data filtering and rendering.

2.1 Tech Stack
- Frontend Framework: React (v18+) with Hooks
- Language: TypeScript
- Build Tool: Vite
- Styling: CSS Variables for theming (Light/Dark mode)
- Visualization: Custom SVG components (no external charting libraries)

2.2 Data Layer
The application implements a flexible data fetching layer in src/api/client.ts that supports three modes:
- REST: Consumes standard JSON endpoints.
- GraphQL: Executes structured queries for precise data retrieval.
- Mock Data: Fallback to local JSON-stat files (sample_bmi.json) for offline development and testing.

## Key Features
3.1 Interactive Visualization
Users can switch between three primary visualization modes:

- Pie Chart: Visualizes the distribution of BMI categories (Underweight, Normal, Overweight, Obese) for a selected dataset. It features a responsive layout with a non-overlapping legend.
- Bar Chart: Compares values across different dimensions (e.g., Country, Age Group).
- Line Chart: Displays trends over time, useful for tracking changes in obesity rates across years.

3.2 Advanced Filtering
The App.tsx component manages a complex state of filters, allowing users to slice the data by:

- Time Period: Range slider for years (2014-2022).
- Geography: Multi-select for EU countries.
- Demographics: Filters for Gender (Male, Female, Total) and Age Groups.
- Note: The application includes logic to synthesize gender-specific data when granular breakdown is missing in the raw dataset, applying demographic assumptions (e.g., slightly higher overweight rates in males for certain age brackets) to ensure visual continuity.

3.3 Export Capabilities
The ExportPanel component allows users to export the current view as:

- SVG: For high-quality vector graphics suitable for publications.
- CSV: For further statistical analysis in external tools.
