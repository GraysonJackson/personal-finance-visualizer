# Spending Flow — Personal Finance Visualizer

A client-side data visualization dashboard that turns personal finance data into something visually meaningful. Built with D3.js and vanilla JavaScript — no frameworks, no build tools, no server required.

## What This Is

Most personal finance tools show you numbers in tables. This one shows you where your money actually goes using a Sankey flow diagram and a stacked area chart. The goal was to prove that financial data can be both informative and visually compelling without relying on a charting library that does everything behind the scenes.

I built this using D3.js directly rather than wrapping it in React or using a higher-level library. The reason was deliberate: I wanted to demonstrate understanding of D3's enter/update/exit pattern, data binding, and transition system at a lower level than most portfolio projects go.

## Features

- **Sankey Flow Diagram:** Shows how income sources flow into spending categories. The width of each flow is proportional to the amount — immediately intuitive.
- **Stacked Area Chart:** Tracks spending over 12 months with smooth transitions between filtered states. Hover any category to isolate it.
- **CSV Upload:** Drop in your own data (either Sankey format or monthly spending format) and the charts update immediately. No processing happens on a server — everything stays in the browser.
- **Summary Cards:** Income, spending, and net savings calculated from the current dataset. Color-coded to show whether you're saving or overspending.
- **Responsive:** Charts resize with the window. No separate mobile layout needed — the SVG scales naturally.

## Design Decisions

The color palette uses a categorical scheme where green represents income, red represents expenses, and blue represents savings. This mapping is consistent across both charts so the user doesn't have to re-learn the color language when looking at different visualizations.

The area chart uses D3's `curveMonotoneX` interpolation rather than a linear step function. This makes trends easier to read visually while still accurately representing the data points. The transitions between filtered states use 750ms eased animations — fast enough to feel responsive, slow enough to be readable.

## Why No Server

Running everything client-side was a deliberate choice. Personal finance data is sensitive, and requiring a server upload would add friction and privacy concerns. The CSV parsing happens in the browser, the charts render in SVG, and no data ever leaves the machine. This constraint also simplified the architecture considerably.

## Technical Details

- D3.js v7 for all visualization
- d3-sankey plugin for flow layout calculation
- Google Fonts: Inter (UI) and JetBrains Mono (data labels)
- Pure vanilla JavaScript — no build step required
- CSS custom properties for theming
- FileReader API for client-side CSV processing

## Running Locally

No build step needed. Open `index.html` in a browser, or serve with any static file server:

```bash
# Using Python
python -m http.server 8000

# Using Node
npx serve .
```

## CSV Formats

**Sankey data format:**
```csv
Source,Target,Value
Salary,Rent,1500
Salary,Groceries,400
```

**Monthly spending format:**
```csv
month,Rent,Groceries,Utilities,Transport,Dining,Entertainment
Jan,1500,380,180,140,280,190
```

---

## Presentation Guidelines

### What to Say

This project is about proving you can use D3.js directly — not just调用 a wrapper library. The Sankey diagram shows understanding of graph layout algorithms. The stacked area chart shows understanding of data transformation and animated transitions. The CSV upload shows practical UX thinking about how real users interact with data.

### Key Decisions to Discuss

1. **Why D3 directly instead of Recharts or Chart.js?** Higher-level libraries abstract away the parts that are most interesting to talk about in an interview. Using D3 directly means you can explain exactly how the data flows from raw values to rendered SVG.

2. **Why client-side only?** Privacy constraint that also simplifies architecture. Good example of letting a limitation shape the design rather than fighting it.

3. **Why Sankey specifically?** It's the natural visualization for flow data. Income flows into categories — the diagram makes that relationship spatial and proportional.

### What to Show

- Open the Sankey diagram and hover over different nodes to show the interactivity
- Upload a CSV file and show the charts updating in real time
- Click on a node in the Sankey diagram and show how the area chart filters
- Point out the transition animation duration and why it was chosen

### What NOT to Say

Don't oversell this as a "production-ready finance app." It's a visualization prototype. Be honest about that — it makes the rest of your pitch more credible.

Don't say "I used D3 to create beautiful charts." Say "I used D3's stack layout and area generator to transform monthly spending data into a stacked area chart with animated transitions between filtered states." Specific beats impressive.

### Potential Follow-up Questions

- "How would you add real bank data?" — Talk about Plaid API integration and the privacy implications of moving from client-side to server-side processing.
- "Why not use a charting library?" — Already covered, but be ready to name specific D3 features you used (sankey layout, stack layout, area generator, transitions).
- "How does the CSV parsing work?" — FileReader API splits lines, maps headers to values, and feeds the result directly into D3's data binding system.