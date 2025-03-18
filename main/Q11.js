function drawQ11() {
    // Xóa nội dung cũ nhưng giữ lại SVG container
    d3.select("#chart").selectAll("*").remove();
    
    d3.csv("data/data_ggsheet.csv").then(data => {
        // Đếm số lượng distinct mã đơn hàng theo từng khách hàng
        const purchaseCounts = d3.rollup(
            data,
            v => new Set(v.map(d => d["Mã đơn hàng"])).size,
            d => d["Mã khách hàng"]
        );

        // Gom nhóm số lượng khách hàng theo số lần mua
        const purchaseDistribution = d3.rollup(
            [...purchaseCounts.values()],
            v => v.length,
            d => d
        );

        // Chuyển dữ liệu thành mảng để vẽ biểu đồ
        let transformedData = Array.from(purchaseDistribution, ([purchaseTimes, customerCount]) => ({
            purchaseTimes, customerCount
        })).sort((a, b) => a.purchaseTimes - b.purchaseTimes);

        // Thiết lập kích thước
        const margin = { top: 50, right: 50, bottom: 50, left: 80 },
            width = 1200 - margin.left - margin.right,
            height = 600 - margin.top - margin.bottom;
        
        // Cập nhật kích thước SVG
        const svg = d3.select("#chart").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);

        // Tạo thang đo
        const xScale = d3.scaleBand()
            .domain(transformedData.map(d => d.purchaseTimes))
            .range([0, width])
            .padding(0.1);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(transformedData, d => d.customerCount)])
            .nice()
            .range([height, 0]);

        // Tiêu đề
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", -20)
            .attr("text-anchor", "middle")
            .style("font-size", "22px")
            .style("font-weight", "bold")
            .text("Phân phối lượt mua hàng");

        // Tooltip
        const tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("background", "white")
            .style("border", "1px solid #ddd")
            .style("padding", "10px")
            .style("border-radius", "5px")
            .style("box-shadow", "0px 0px 5px rgba(0,0,0,0.2)")
            .style("opacity", 0)
            .style("pointer-events", "none");

        // Vẽ cột
        svg.selectAll(".bar")
            .data(transformedData)
            .enter().append("rect")
            .attr("class", "bar")
            .attr("x", d => xScale(d.purchaseTimes))
            .attr("y", d => yScale(d.customerCount))
            .attr("width", xScale.bandwidth())
            .attr("height", d => height - yScale(d.customerCount))
            .attr("fill", "steelblue")
            .on("mouseover", (event, d) => {
                tooltip.style("opacity", 1)
                    .html(`Đã mua <strong>${d.purchaseTimes}</strong> lần <br>
                        Số khách hàng: <strong>${d.customerCount}</strong>`)
                    .style("left", (event.pageX + 15) + "px")
                    .style("top", (event.pageY - 10) + "px");
            })
            .on("mousemove", (event) => {
                tooltip.style("left", (event.pageX + 15) + "px")
                    .style("top", (event.pageY - 10) + "px");
            })
            .on("mouseout", () => {
                tooltip.style("opacity", 0);
            });

        // Vẽ trục
        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(xScale).tickFormat(d => d));

        svg.append("g")
            .call(d3.axisLeft(yScale).ticks(5));
    }).catch(error => {
        console.error("Lỗi khi đọc CSV:", error);
    });
}
