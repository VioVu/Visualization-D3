function drawQ9() {
    d3.select("#chart").selectAll("*").remove(); // Xóa nội dung cũ

    let chartWidth = window.innerWidth * 0.95;  
    let chartHeight = window.innerHeight * 0.85;  
    let margin = { top: 70, right: 100, bottom: 50, left: 150 };

    let rows = 2, cols = 3;
    let subChartWidth = (chartWidth - margin.left - margin.right) / cols; 
    let subChartHeight = (chartHeight - margin.top - margin.bottom) / rows;

    d3.csv("data/data_ggsheet.csv").then(data => {
        let groupedData = d3.group(data, d => `[${d["Mã nhóm hàng"]}] ${d["Tên nhóm hàng"]}`);

        let svg = d3.select("#chart")
            .append("svg")
            .attr("width", chartWidth)
            .attr("height", chartHeight)
            .style("background", "#f9f9f9");

            // Thêm tiêu đề chung
            svg.append("text")
            .attr("x", chartWidth / 2)
            .attr("y", 20)
            .attr("text-anchor", "middle")
            .style("font-size", "20px")
            .style("font-weight", "bold")
            .text("Xác suất bán hàng của Mặt hàng theo Nhóm hàng theo từng Tháng");

        let colorScale = d3.scaleOrdinal(d3.schemeCategory10); 

        let groups = Array.from(groupedData.entries());

        groups.forEach(([groupName, items], index) => {
            let col = index % cols;
            let row = Math.floor(index / cols);

            let xOffset = col * subChartWidth + margin.left ;
            let yOffset = row * subChartHeight + margin.top;

            let g = svg.append("g")
                .attr("transform", `translate(${xOffset},${yOffset})`);

            let totalDistinctOrders = new Set(items.map(d => d["Mã đơn hàng"])).size;

            let itemOrders = d3.rollup(
                items,
                v => new Set(v.map(d => d["Mã đơn hàng"])).size,
                d => `[${d["Mã mặt hàng"]}] ${d["Tên mặt hàng"]}`
            );

            let transformedData = Array.from(itemOrders, ([item, count]) => ({
                item: item,
                probability: (count / totalDistinctOrders) * 100
            })).sort((a, b) => b.probability - a.probability).slice(0, 10);

            let xScale = d3.scaleLinear()
                .domain([0, d3.max(transformedData, d => d.probability) * 1.2])
                .range([0, subChartWidth - margin.left - margin.right]);

            let yScale = d3.scaleBand()
                .domain(transformedData.map(d => d.item))
                .range([0, subChartHeight - margin.top - margin.bottom])
                .padding(0.6);
        // Tiêu đề

            g.selectAll(".bar")
                .data(transformedData)
                .enter().append("rect")
                .attr("x", 0)
                .attr("y", d => yScale(d.item))
                .attr("width", d => xScale(d.probability))
                .attr("height", yScale.bandwidth())
                .attr("fill", d => colorScale(d.item));

            g.selectAll(".text-label")
                .data(transformedData)
                .enter().append("text")
                .attr("x", d => xScale(d.probability) + 10)
                .attr("y", d => yScale(d.item) + yScale.bandwidth() / 2 + 4)
                .style("font-size", "12px")
                .style("fill", "#000")
                .style("text-anchor", "start")
                .text(d => `${d.probability.toFixed(2)}%`);

            g.append("g").call(d3.axisLeft(yScale).tickSize(0))
                .selectAll("text").style("font-size", "12px");

            g.append("g")
                .attr("transform", `translate(0,${subChartHeight - margin.top - margin.bottom})`)
                .call(d3.axisBottom(xScale).ticks(5))
                .selectAll("text")
                .style("font-size", "10px")
                .attr("dy", "1em");

            svg.append("text")
                .attr("x", xOffset + subChartWidth / 3)
                .attr("y", yOffset - 10)
                .attr("text-anchor", "middle")
                .style("font-size", "14px")
                .style("font-weight", "bold")
                .text(`${groupName}`);
        // Tạo tooltip
        let tooltip = d3.select("body")
                        .append("div")
                        .style("position", "absolute")
                        .style("background", "rgba(0, 0, 0, 0.8)")
                        .style("color", "#fff")
                        .style("padding", "8px")
                        .style("border-radius", "5px")
                        .style("font-size", "12px")
                        .style("pointer-events", "none")
                        .style("display", "none");
            g.selectAll(".bar")
                .data(transformedData)
                .enter().append("rect")
                .attr("x", 0)
                .attr("y", d => yScale(d.item))
                .attr("width", d => xScale(d.probability))
                .attr("height", yScale.bandwidth())
                .attr("fill", d => colorScale(d.item))
                .on("mouseover", (event, d) => {
                    tooltip.style("display", "block")
                        .html(
                            `<strong>Mặt hàng:</strong> ${d.item} <br>
                            <strong>Nhóm hàng:</strong> ${groupName} <br>
                            <strong>Xác suất:</strong> ${d.probability.toFixed(2)}%`
                        );
                })
                .on("mousemove", (event) => {
                    tooltip.style("top", `${event.pageY - 30}px`)
                        .style("left", `${event.pageX + 10}px`);
                })
                .on("mouseout", () => {
                    tooltip.style("display", "none");
                });


            });
    }).catch(error => {
        console.error("Lỗi khi đọc CSV:", error);
    });
}

// Đảm bảo vẽ lại khi thay đổi kích thước trình duyệt
window.addEventListener("resize", drawQ9);

// Gọi lần đầu để vẽ

