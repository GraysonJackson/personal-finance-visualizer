// Main application logic for the personal finance visualizer
// Handles data loading, chart initialization, and interactivity

document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const csvUpload = document.getElementById('csvUpload');
    const resetDataBtn = document.getElementById('resetData');
    const dataStatus = document.getElementById('dataStatus');
    const totalIncomeEl = document.getElementById('totalIncome');
    const totalSpendingEl = document.getElementById('totalSpending');
    const netSavingsEl = document.getElementById('netSavings');

    // State
    let currentData = sampleData;
    let currentSpendingData = monthlySpending;
    let isUsingSampleData = true;

    // Initialize charts
    createSankeyChart(currentData, 'sankeyContainer');
    createAreaChart(currentSpendingData, 'areaContainer', categoryColors);

    // Update summary cards
    updateSummaryCards();

    // Event listeners
    csvUpload.addEventListener('change', handleFileUpload);
    resetDataBtn.addEventListener('click', resetToSampleData);

    // Handle CSV file upload
    function handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const csvText = e.target.result;
                const parsed = parseCSV(csvText);

                // Check if this is a Sankey data CSV or spending data CSV
                if (parsed.headers.includes('Source') || parsed.headers.includes('source')) {
                    // Sankey data format
                    const sankeyData = csvToSankeyData(parsed);
                    currentData = sankeyData;
                    createSankeyChart(currentData, 'sankeyContainer');

                    // Update status
                    dataStatus.textContent = `Using ${file.name}`;
                    isUsingSampleData = false;

                    // Update summary cards
                    updateSummaryCards();
                } else if (parsed.headers.includes('month')) {
                    // Spending data format
                    currentSpendingData = parsed.rows;
                    createAreaChart(currentSpendingData, 'areaContainer', categoryColors);

                    // Update status
                    dataStatus.textContent = `Using ${file.name}`;
                    isUsingSampleData = false;

                    // Update summary cards
                    updateSummaryCards();
                } else {
                    throw new Error('Invalid CSV format. Expected columns: Source, Target, Value or month, category1, category2,...');
                }
            } catch (error) {
                alert(`Error processing file: ${error.message}`);
                console.error(error);
            }
        };
        reader.readAsText(file);
    }

    // Reset to sample data
    function resetToSampleData() {
        currentData = sampleData;
        currentSpendingData = monthlySpending;
        createSankeyChart(currentData, 'sankeyContainer');
        createAreaChart(currentSpendingData, 'areaContainer', categoryColors);
        dataStatus.textContent = 'Using sample data';
        isUsingSampleData = true;
        updateSummaryCards();
    }

    // Update summary cards with calculated values
    function updateSummaryCards() {
        // Calculate total income
        const totalIncome = currentData.links
            .filter(link => currentData.nodes[link.source].name === 'Salary' ||
                          currentData.nodes[link.source].name === 'Freelance')
            .reduce((sum, link) => sum + link.value, 0);

        // Calculate total spending
        const totalSpending = currentData.links
            .filter(link => currentData.nodes[link.target].name !== 'Savings')
            .reduce((sum, link) => sum + link.value, 0);

        // Calculate net savings
        const netSavings = totalIncome - totalSpending;

        // Update DOM
        totalIncomeEl.querySelector('.summary-value').textContent = `$${totalIncome.toLocaleString()}`;
        totalSpendingEl.querySelector('.summary-value').textContent = `$${totalSpending.toLocaleString()}`;
        netSavingsEl.querySelector('.summary-value').textContent = `$${netSavings.toLocaleString()}`;

        // Color coding for savings
        if (netSavings >= 0) {
            netSavingsEl.querySelector('.summary-value').style.color = 'var(--color-secondary)';
        } else {
            netSavingsEl.querySelector('.summary-value').style.color = 'var(--color-accent)';
        }
    }

    // Handle Sankey node clicks to filter area chart
    window.handleSankeyNodeClick = function(nodeName) {
        if (nodeName === 'Salary' || nodeName === 'Freelance') {
            // Reset to show all categories
            updateAreaChart(currentSpendingData);
        } else if (nodeName === 'Savings') {
            // Show only the savings category
            const filteredData = currentSpendingData.map(month => ({
                month: month.month,
                Savings: month.Savings || 0
            }));
            updateAreaChart(filteredData);
        } else {
            // Show only the clicked category
            const filteredData = currentSpendingData.map(month => ({
                month: month.month,
                [nodeName]: month[nodeName] || 0
            }));
            updateAreaChart(filteredData);
        }
    };
});