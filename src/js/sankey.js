// Sankey diagram implementation using D3.js
// Creates a flow diagram showing income → spending relationships
// Uses D3's sankey plugin for the layout and morphing transitions

// Main function to create and update the Sankey diagram
function createSankeyChart(data, containerId) {
    // Set up dimensions and margins
    const margin = { top: 20, right: 20, bottom: 20, left: 20 };
    const width = document.getElementById(containerId).clientWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Clear any existing content
    d3.select(`#${containerId}`).selectAll("*").remove();

    // Create SVG container
    const svg = d3.select(`#${containerId}`)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Set up the Sankey generator
    const sankey = d3.sankey()
        .nodeWidth(15)
        .nodePadding(10)
        .extent([[1, 1], [width - 1, height - 6]]);

    // Prepare the data for the Sankey diagram
    const { nodes, links } = sankey({
        nodes: data.nodes.map(d => Object.assign({}, d)),
        links: data.links.map(d => Object.assign({}, d))
    });

    // Add links (the flows between nodes)
    const link = svg.append("g")
        .attr("class", "links")
        .selectAll("path")
        .data(links)
        .enter()
        .append("path")
        .attr("d", d3.sankeyLinkHorizontal())
        .attr("stroke", d => getNodeColor(d.source.name))
        .attr("stroke-width", d => Math.max(1, d.width))
        .attr("fill", "none")
        .attr("stroke-opacity", 0.5);

    // Add nodes (the categories)
    const node = svg.append("g")
        .attr("class", "nodes")
        .selectAll("g")
        .data(nodes)
        .enter()
        .append("g");

    // Add rectangles for the nodes
    node.append("rect")
        .attr("x", d => d.x0)
        .attr("y", d => d.y0)
        .attr("height", d => d.y1 - d.y0)
        .attr("width", d => d.x1 - d.x0)
        .attr("fill", d => getNodeColor(d.name))
        .attr("stroke", "#000")
        .attr("stroke-width", 1);

    // Add labels for the nodes
    node.append("text")
        .attr("x", d => d.x0 - 6)
        .attr("y", d => (d.y1 + d.y0) / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", "end")
        .text(d => d.name)
        .style("font-family", "var(--font-body)")
        .style("font-size", "12px");

    // Add title for each link
    link.append("title")
        .text(d => `${d.source.name} → ${d.target.name}\n$${d.value.toLocaleString()}`);

    // Add interactivity: highlight nodes and links on hover
    node.on("mouseover", function(event, d) {
        // Highlight the hovered node
        d3.select(this).select("rect")
            .attr("stroke-width", 2)
            .attr("stroke", "#000");

        // Highlight connected links
        link.filter(l => l.source === d || l.target === d)
            .attr("stroke-opacity", 0.8)
            .attr("stroke-width", l => Math.max(2, l.width));
    });

    node.on("mouseout", function(event, d) {
        // Reset node highlight
        d3.select(this).select("rect")
            .attr("stroke-width", 1)
            .attr("stroke", "#000");

        // Reset link highlights
        link.filter(l => l.source === d || l.target === d)
            .attr("stroke-opacity", 0.5)
            .attr("stroke-width", l => Math.max(1, l.width));
    });

    // Add click handler to filter the diagram
    node.on("click", function(event, d) {
        // Toggle active state
        d.active = !d.active;

        // Update node appearance
        d3.select(this).select("rect")
            .attr("fill", d.active ? "#333" : getNodeColor(d.name));

        // Filter links based on active nodes
        const activeNodes = nodes.filter(n => n.active);
        if (activeNodes.length > 0) {
            const activeLinks = links.filter(l =>
                activeNodes.includes(l.source) ||
                activeNodes.includes(l.target)
            );

            // Update link visibility
            link.attr("display", l => activeLinks.includes(l) ? "block" : "none");
        } else {
            // Show all links if no nodes are active
            link.attr("display", "block");
        }
    });

    // Helper function to get color for a node
    function getNodeColor(nodeName) {
        if (nodeName === "Salary" || nodeName === "Freelance") {
            return "#2ecc71"; // Green for income
        } else if (nodeName === "Savings") {
            return "#3498db"; // Blue for savings
        } else {
            return "#e74c3c"; // Red for expenses
        }
    }

    // Handle window resize
    window.addEventListener("resize", () => {
        const newWidth = document.getElementById(containerId).clientWidth - margin.left - margin.right;
        svg.attr("width", newWidth + margin.left + margin.right);
        sankey.extent([[1, 1], [newWidth - 1, height - 6]]);
        updateSankey();
    });

    // Update function for responsive changes
    function updateSankey() {
        const { nodes: updatedNodes, links: updatedLinks } = sankey({
            nodes: data.nodes.map(d => Object.assign({}, d)),
            links: data.links.map(d => Object.assign({}, d))
        });

        link.data(updatedLinks)
            .attr("d", d3.sankeyLinkHorizontal());

        node.data(updatedNodes)
            .select("rect")
            .attr("x", d => d.x0)
            .attr("y", d => d.y0)
            .attr("height", d => d.y1 - d.y0)
            .attr("width", d => d.x1 - d.x0);

        node.select("text")
            .attr("x", d => d.x0 - 6)
            .attr("y", d => (d.y1 + d.y0) / 2);
    }
}