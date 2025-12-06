import "./Documentation.css";

export default function Documentation() {
  return (
    <div className="documentation-page">
      <article itemScope itemType="http://schema.org/ScholarlyArticle">
        <header>
          <h1 itemProp="headline">ChartWizard: Interactive Visualization of Eurostat BMI Data</h1>
          <div className="authors">
            <span itemProp="author" itemScope itemType="http://schema.org/Person">
              <span itemProp="name">Luca Daniel Ionescu</span>
            </span>
          </div>
        </header>

        <section role="doc-abstract" itemProp="description">
          <h2>Abstract</h2>
          <p>
            ChartWizard is a modern web application designed to visualize Body Mass Index (BMI) statistics across
            European countries. Leveraging data from Eurostat, the application provides an interactive interface for
            analyzing trends in obesity and underweight rates by country, year, gender, and age group. This document
            outlines the architectural design, technical implementation, and key features of the application,
            highlighting its custom SVG-based charting engine and flexible data integration strategies.
          </p>
        </section>

        <section role="doc-introduction">
          <h2>1. Introduction</h2>
          <p>
            The prevalence of obesity and other weight-related issues is a significant public health concern in Europe.
            ChartWizard aims to make this data accessible and understandable through dynamic visualizations. By
            offering multiple chart types (Bar, Line, Pie) and granular filtering options, the application serves as a
            tool for researchers, policy makers, and the general public to explore demographic patterns in BMI
            categories.
          </p>
        </section>

        <section id="architecture">
          <h2>2. System Architecture</h2>
          <p>
            The application is built as a Single Page Application (SPA) using the <strong>React</strong> framework and{" "}
            <strong>TypeScript</strong>. It emphasizes a modular component structure and efficient state management to
            handle data filtering and rendering.
          </p>

          <h3>2.1 Tech Stack</h3>
          <ul>
            <li>
              <strong>Frontend Framework:</strong> React (v18+) with Hooks
            </li>
            <li>
              <strong>Language:</strong> TypeScript
            </li>
            <li>
              <strong>Build Tool:</strong> Vite
            </li>
            <li>
              <strong>Styling:</strong> CSS Variables for theming (Light/Dark mode)
            </li>
            <li>
              <strong>Visualization:</strong> Custom SVG components (no external charting libraries)
            </li>
          </ul>

          <h3>2.2 Data Layer</h3>
          <p>
            The application implements a flexible data fetching layer in <code>src/api/client.ts</code> that supports
            three modes:
          </p>
          <ul>
            <li>
              <strong>REST:</strong> Consumes standard JSON endpoints.
            </li>
            <li>
              <strong>GraphQL:</strong> Executes structured queries for precise data retrieval.
            </li>
            <li>
              <strong>Mock Data:</strong> Fallback to local JSON-stat files (<code>sample_bmi.json</code>) for offline
              development and testing.
            </li>
          </ul>
        </section>

        <section id="features">
          <h2>3. Key Features</h2>

          <h3>3.1 Interactive Visualization</h3>
          <p>Users can switch between three primary visualization modes:</p>
          <ul>
            <li>
              <strong>Pie Chart:</strong> Visualizes the distribution of BMI categories (Underweight, Normal,
              Overweight, Obese) for a selected dataset. It features a responsive layout with a non-overlapping
              legend.
            </li>
            <li>
              <strong>Bar Chart:</strong> Compares values across different dimensions (e.g., Country, Age Group).
            </li>
            <li>
              <strong>Line Chart:</strong> Displays trends over time, useful for tracking changes in obesity rates
              across years.
            </li>
          </ul>

          <h3>3.2 Advanced Filtering</h3>
          <p>
            The <code>App.tsx</code> component manages a complex state of filters, allowing users to slice the data by:
          </p>
          <ul>
            <li>
              <strong>Time Period:</strong> Range slider for years (2014-2022).
            </li>
            <li>
              <strong>Geography:</strong> Multi-select for EU countries.
            </li>
            <li>
              <strong>Demographics:</strong> Filters for Gender (Male, Female, Total) and Age Groups.
            </li>
          </ul>
          <p>
            <em>Note:</em> The application includes logic to synthesize gender-specific data when granular breakdown is
            missing in the raw dataset, applying demographic assumptions (e.g., slightly higher overweight rates in
            males for certain age brackets) to ensure visual continuity.
          </p>

          <h3>3.3 Export Capabilities</h3>
          <p>
            The <code>ExportPanel</code> component allows users to export the current view as:
          </p>
          <ul>
            <li>
              <strong>SVG:</strong> For high-quality vector graphics suitable for publications.
            </li>
            <li>
              <strong>CSV:</strong> For further statistical analysis in external tools.
            </li>
          </ul>
        </section>

        <section id="implementation">
          <h2>4. Implementation Details</h2>

          <h3>4.1 Custom Charting Engine</h3>
          <p>
            Instead of relying on heavy third-party libraries, ChartWizard implements lightweight, custom SVG charts.
            Files like <code>PieChart.tsx</code>, <code>BarChart.tsx</code>, and <code>LineChart.tsx</code> use
            mathematical calculations (trigonometry for pie slices, linear scales for axes) to render{" "}
            <code>&lt;path&gt;</code>, <code>&lt;rect&gt;</code>, and <code>&lt;circle&gt;</code> elements directly.
            This ensures complete control over rendering performance and styling.
          </p>

          <h3>4.2 JSON-stat Integration</h3>
          <p>
            The application includes a robust parser for the <strong>JSON-stat</strong> format, a standard for
            statistical data. The <code>jsonStatToBmi</code> function in <code>client.ts</code> normalizes
            multidimensional datasets into a flat array of <code>BmiRecord</code> objects, making them easily
            consumable by the React components.
          </p>
        </section>

        <section role="doc-conclusion">
          <h2>5. Conclusion & Future Work</h2>
          <p>
            ChartWizard demonstrates how modern web technologies can be used to create effective, accessible data
            visualizations. Future enhancements may include server-side rendering (SSR) for improved performance on
            low-end devices, integration with live Eurostat API endpoints, and expanded accessibility features (ARIA
            descriptions for screen readers).
          </p>
        </section>
      </article>
    </div>
  );
}
