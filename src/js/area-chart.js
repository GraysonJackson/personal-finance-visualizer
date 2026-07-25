// Stacked area chart for spending over time using D3.js
// Animates transitions between filtered states using D3's enter/update/exit pattern

function createAreaChart(data, containerId, colors) {
    const margin = { top: 20, right: 90, bottom: 30, left: 50 };
    const containerEl = document.getElementById(containerId);
    const width = getInnerWidth(containerEl) - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    d3.select(`#${containerId}`).selectAll("*").remove();

    const svg = d3.select(`#${containerId}`)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Parse months
    const parseMonth = d => d.month;
    const months = data.map(parseMonth);

    // Stack the data
    const keys = Object.keys(data[0]).filter(k => k !== "month");
    const stack = d3.stack()
        .keys(keys)
        .order(d3.stackOrderNone)
        .offset(d3.stackOffsetNone);

    const series = stack(data);

    // Scales
    const x = d3.scalePoint()
        .domain(months)
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(series, s => d3.max(s, d => d[1])) * 1.1])
        .range([height, 0]);

    const color = d3.scaleOrdinal()
        .domain(keys)
        .range(keys.map(k => colors[k] || "#999"));

    // Area generator with smooth curves
    const area = d3.area()
        .x((d, i) => x(months[i]))
        .y0(d => y(d[0]))
        .y1(d => y(d[1]))
        .curve(d3.curveMonotoneX);

    // Draw areas with enter animation
    svg.selectAll("path.area")
        .data(series)
        .enter()
        .append("path")
        .attr("class", "area")
        .attr("d", area)
        .attr("fill", d => color(d.key))
        .attr("opacity", 0.7)
        .attr("stroke", d => color(d.key))
        .attr("stroke-width", 1)
        .on("mouseover", function(event, d) {
            d3.selectAll("path.area").attr("opacity", 0.3);
            d3.select(this).attr("opacity", 0.9);
            updateTooltip(event, d.key);
        })
        .on("mouseout", function() {
            d3.selectAll("path.area").attr("opacity", 0.7);
            hideTooltip();
        });

    // X axis
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .style("font-family", "var(--font-mono)")
        .style("font-size", "11px");

    // Y axis
    svg.append("g")
        .call(d3.axisLeft(y).ticks(6).tickFormat(d => `$${d}`))
        .selectAll("text")
        .style("font-family", "var(--font-mono)")
        .style("font-size", "11px");

    // Legend
    const legend = svg.append("g")
        .attr("transform", `translate(${width + 10}, 0)`);

    keys.forEach((key, i) => {
        const g = legend.append("g")
            .attr("transform", `translate(0, ${i * 20})`);

        g.append("rect")
            .attr("width", 12)
            .attr("height", 12)
            .attr("fill", color(key));

        g.append("text")
            .attr("x", 16)
            .attr("y", 10)
            .text(key)
            .style("font-family", "var(--font-body)")
            .style("font-size", "11px")
            .style("fill", "#666");
    });

    // Tooltip
    const tooltip = d3.select(`#${containerId}`)
        .append("div")
        .style("position", "absolute")
        .style("background", "rgba(0,0,0,0.8)")
        .style("color", "#fff")
        .style("padding", "8px 12px")
        .style("border-radius", "4px")
        .style("font-family", "var(--font-mono)")
        .style("font-size", "12px")
        .style("pointer-events", "none")
        .style("opacity", 0);

    function updateTooltip(event, key) {
        tooltip
            .html(`<strong>${key}</strong>`)
            .style("left", (event.offsetX + 10) + "px")
            .style("top", (event.offsetY - 10) + "px")
            .style("opacity", 1);
    }

    function hideTooltip() {
        tooltip.style("opacity", 0);
    }

    // Update function for filtering
    window.updateAreaChart = function(filteredData) {
        const newSeries = stack(filteredData);
        const newMonths = filteredData.map(parseMonth);

        x.domain(newMonths);

        y.domain([0, d3.max(newSeries, s => d3.max(s, d => d[1])) * 1.1]);

        // Update areas with transition
        svg.selectAll("path.area")
            .data(newSeries)
            .transition()
            .duration(750)
            .attr("d", area)
            .attr("fill", d => color(d.key));

        // Update axes
        svg.select("g").transition().duration(750)
            .call(d3.axisBottom(x));

        svg.selectAll("g").filter((d, i) => i === 1)
            .transition().duration(750)
            .call(d3.axisLeft(y).ticks(6).tickFormat(d => `$${d}`));
    };

    // Handle window resize
    window.addEventListener("resize", () => {
        const newWidth = getInnerWidth(containerEl) - margin.left - margin.right;
        svg.attr("width", newWidth + margin.left + margin.right);
        x.range([0, newWidth]);
        legend.attr("transform", `translate(${newWidth + 10}, 0)`);
        svg.selectAll("path.area").attr("d", area);
        svg.select("g").call(d3.axisBottom(x));
    });
}