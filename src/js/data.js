// Sample financial data for the Sankey diagram
// Represents a typical monthly income → spending flow
const sampleData = {
    nodes: [
        { name: "Salary" },
        { name: "Freelance" },
        { name: "Rent" },
        { name: "Groceries" },
        { name: "Utilities" },
        { name: "Transport" },
        { name: "Dining" },
        { name: "Entertainment" },
        { name: "Savings" },
    ],
    links: [
        { source: 0, target: 2, value: 1500 },
        { source: 0, target: 3, value: 400 },
        { source: 0, target: 4, value: 200 },
        { source: 0, target: 5, value: 150 },
        { source: 0, target: 8, value: 750 },
        { source: 1, target: 6, value: 300 },
        { source: 1, target: 7, value: 200 },
        { source: 1, target: 8, value: 500 },
    ]
};

// Monthly spending data for the area chart
const monthlySpending = [
    { month: "Jan", Rent: 1500, Groceries: 380, Utilities: 180, Transport: 140, Dining: 280, Entertainment: 190 },
    { month: "Feb", Rent: 1500, Groceries: 420, Utilities: 190, Transport: 150, Dining: 260, Entertainment: 210 },
    { month: "Mar", Rent: 1500, Groceries: 390, Utilities: 210, Transport: 160, Dining: 310, Entertainment: 180 },
    { month: "Apr", Rent: 1500, Groceries: 410, Utilities: 200, Transport: 145, Dining: 290, Entertainment: 220 },
    { month: "May", Rent: 1500, Groceries: 430, Utilities: 195, Transport: 155, Dining: 320, Entertainment: 250 },
    { month: "Jun", Rent: 1500, Groceries: 400, Utilities: 185, Transport: 150, Dining: 340, Entertainment: 230 },
    { month: "Jul", Rent: 1500, Groceries: 440, Utilities: 175, Transport: 140, Dining: 350, Entertainment: 260 },
    { month: "Aug", Rent: 1500, Groceries: 415, Utilities: 180, Transport: 145, Dining: 330, Entertainment: 240 },
    { month: "Sep", Rent: 1500, Groceries: 395, Utilities: 195, Transport: 155, Dining: 300, Entertainment: 200 },
    { month: "Oct", Rent: 1500, Groceries: 405, Utilities: 205, Transport: 150, Dining: 285, Entertainment: 195 },
    { month: "Nov", Rent: 1500, Groceries: 425, Utilities: 215, Transport: 160, Dining: 310, Entertainment: 225 },
    { month: "Dec", Rent: 1500, Groceries: 450, Utilities: 220, Transport: 165, Dining: 360, Entertainment: 280 },
];

const categories = ["Rent", "Groceries", "Utilities", "Transport", "Dining", "Entertainment"];

const categoryColors = {
    Rent: "#e74c3c",
    Groceries: "#2ecc71",
    Utilities: "#3498db",
    Transport: "#f39c12",
    Dining: "#9b59b6",
    Entertainment: "#1abc9c"
};

// Simple CSV parser using PapaParse or manual parsing
function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const rows = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const row = {};
        headers.forEach((h, idx) => row[h] = values[idx] || '');
        rows.push(row);
    }
    
    return { headers, rows };
}

// Convert parsed CSV to our Sankey format
function csvToSankeyData(parsed) {
    // Expected columns: Source, Target, Value
    const nodes = [];
    const nodeMap = {};
    const links = [];
    
    parsed.rows.forEach(row => {
        const src = row.Source || row.source;
        const tgt = row.Target || row.target;
        const val = parseFloat(row.Value || row.value) || 0;
        
        if (!src || !tgt || val <= 0) return;
        
        if (!(src in nodeMap)) {
            nodeMap[src] = nodes.length;
            nodes.push({ name: src });
        }
        if (!(tgt in nodeMap)) {
            nodeMap[tgt] = nodes.length;
            nodes.push({ name: tgt });
        }
        
        links.push({ source: nodeMap[src], target: nodeMap[tgt], value: val });
    });
    
    return { nodes, links };
}