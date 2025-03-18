function drawQ10() { 
    d3.select("#chart").selectAll("*").remove(); // Xóa nội dung cũ

    let chartWidth = 1500;
    let chartHeight = 600;
    let margin = { top: 50, right: 20, bottom: 50, left: 50 };

    let rows = 2, cols = 3;
    let spacing = 5; // Khoảng cách giữa các biểu đồ
    let subChartWidth = 400;
    let subChartHeight = (chartHeight - margin.top - margin.bottom - (rows - 1) * spacing) / rows;
    



    d3.csv("data/data_ggsheet.csv").then(data => {
        const parseDate = d3.timeParse("%Y-%m-%d %H:%M:%S");
        const formatMonth = d3.timeFormat("T%m");

        data.forEach(d => {
            d.Thang = formatMonth(parseDate(d["Thời gian tạo đơn"]));
        });

        let groupedData = d3.group(data, d => `[${d["Mã nhóm hàng"]}] ${d["Tên nhóm hàng"]}`);
       
        let svg = d3.select("#chart")
            .append("svg")
            .attr("width", chartWidth)
            .attr("height", chartHeight)
            .style("background", "#f9f9f9");
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

            let xOffset = col * (subChartWidth ) + margin.left;
            let yOffset = row * (subChartHeight + spacing) + margin.top;

            let g = svg.append("g").attr("transform", `translate(${xOffset},${yOffset})`);

            let monthlyOrders = d3.rollup(
                items,
                v => new Set(v.map(d => d["Mã đơn hàng"])).size,
                d => d.Thang
            );

            let itemMonthlyOrders = d3.rollup(
                items,
                v => new Set(v.map(d => d["Mã đơn hàng"])).size,
                d => d.Thang,
                d => `[${d["Mã mặt hàng"]}] ${d["Tên mặt hàng"]}`
            );

            let transformedData = [];
            itemMonthlyOrders.forEach((itemMap, month) => {
                let totalOrders = monthlyOrders.get(month) || 1;
                itemMap.forEach((count, item) => {
                    transformedData.push({
                        month: month,
                        item: item,
                        probability: (count / totalOrders) * 100
                    });
                });
            });


            let xScale = d3.scalePoint()
                .domain([...new Set(transformedData.map(d => d.month))])
                .range([0, subChartWidth - margin.left - margin.right]); 
            
            let yScale = d3.scaleLinear()
                .domain([0, d3.max(transformedData, d => d.probability) * 1.2])
                .range([subChartHeight - margin.top - margin.bottom, 0]);

            let line = d3.line()
                .x(d => xScale(d.month))
                .y(d => yScale(d.probability))
                .curve(d3.curveMonotoneX);

            let itemsGrouped = d3.group(transformedData, d => d.item);
        // Tooltip
        let tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("background", "#fff")
            .style("border", "1px solid #ccc")
            .style("padding", "5px")
            .style("border-radius", "5px")
            .style("display", "none")
            .style("pointer-events", "none");
            itemsGrouped.forEach((data, itemName) => {
        let path = g.append("path")
                    .datum(data)
                    .attr("fill", "none")
                    .attr("stroke", colorScale(itemName))
                    .attr("stroke-width", 2)
                    .attr("d", line);

                // Chấm tròn (marker)
                g.selectAll(".dot")
                    .data(data)
                    .enter().append("circle")
                    .attr("cx", d => xScale(d.month))
                    .attr("cy", d => yScale(d.probability))
                    .attr("r", 4)
                    .attr("fill", colorScale(itemName))
                    .attr("stroke", "#fff")
                    .attr("stroke-width", 1.5)
                    .on("mouseover", (event, d) => {
                        tooltip.style("display", "block")
                            .html(`
                                <strong>Mặt hàng:</strong> ${d.item}<br>
                                <strong>Tháng:</strong> ${d.month}<br>
                                <strong>Xác suất:</strong> ${d.probability.toFixed(2)}%
                            `)
                            .style("left", (event.pageX + 15) + "px")
                            .style("top", (event.pageY - 30) + "px");
                    })
                    .on("mousemove", (event) => {
                        tooltip.style("left", (event.pageX + 15) + "px")
                            .style("top", (event.pageY - 30) + "px");
                    })
                    .on("mouseout", () => {
                        tooltip.style("display", "none");
                    });
                    
            });

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
        });
    }).catch(error => {
        console.error("Lỗi khi đọc CSV:", error);
    });
}

