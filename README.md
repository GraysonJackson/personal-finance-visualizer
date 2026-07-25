# Spending Flow colorful data visualization for personal finances. D3-powered Sankey diagram animated stacked area chart turn spending data into something worth looking at.

[Live Demo](https://graysonjackson.github.io/personal-finance-visualizer/)

## What It Does 
Upload a CSV or use seeded fake data to visualize spending patterns. Sankey diagram shows income flowing into spending categories. Stacked area chart shows spending over time. Click a flow segment filter the entire dashboard to that category. 
## Design Decisions 
Where most data dashboards are monochrome utilitarian, this one is unapologetically colorful. Full categorical palette, animated transitions that feel alive. Transitions between filtered states use D3 enter/update/exit pattern with eased morphing, not just fade-in fade-out
## Tech Stack
 **Vanilla JS** - No frameworks, no build step 
 **D3.js** - Sankey diagram, stacked area chart, custom transitions
  **PapaParse** - CSV parsing client-side ## Getting Started

```bash
# Serve locally
npx serve .
# Or open index.html directly in browser