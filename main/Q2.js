function drawQ2() {
    // Xóa nội dung cũ nhưng giữ lại SVG container
    d3.select("#chart").selectAll("*").remove();
    d3.csv("data/data_ggsheet.csv").then(data => {
        // Chuyển đổi dữ liệu: Tính tổng doanh thu theo Nhóm hàng
        const revenueByCategory = d3.rollup(data, 
            v => d3.sum(v, d => +d["Thành tiền"]),  // Tổng doanh thu
            d => `[${d["Mã nhóm hàng"]}] ${d["Tên nhóm hàng"]}` // Nhóm hàng
        );

        // Chuyển dữ liệu thành mảng để dễ vẽ
        let transformedData = Array.from(revenueByCategory, ([category, revenue]) => ({
            category, revenue
        }));

        // Sắp xếp theo doanh thu giảm dần
        transformedData.sort((a, b) => b.revenue - a.revenue);

        // Thiết lập kích thước
        const margin = { top: 50, right: 150, bottom: 50, left: 200 },
        width = 1400 - margin.left - margin.right,
        height = 650 - margin.top - margin.bottom;
        // Cập nhật kích thước SVG
        const svg = d3.select("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);

        // Tạo thang đo
        const xScale = d3.scaleLinear()
            .domain([0, d3.max(transformedData, d => d.revenue) / 1_000_000]) // Tính theo triệu VNĐ
            .range([0, width]);

        const yScale = d3.scaleBand()
            .domain(transformedData.map(d => d.category))
            .range([0, height])
            .padding(0.1);

        const colorScale = d3.scaleOrdinal(d3.schemeSet2);
        svg.append("text")
            .attr("x", width / 2) // Căn giữa theo chiều rộng
            .attr("y", -20)  // Đưa tiêu đề lên trên
            .attr("text-anchor", "middle")
            .style("font-size", "22px")
            .style("font-weight", "bold")
            .text("Doanh thu theo nhóm hàng");
        // Vẽ cột
        svg.selectAll(".bar")
            .data(transformedData)
            .enter().append("rect")
            .attr("class", "bar")
            .attr("y", d => yScale(d.category))
            .attr("x", 0)
            .attr("height", yScale.bandwidth())
            .attr("width", d => xScale(d.revenue / 1_000_000)) // Đơn vị triệu VNĐ
            .attr("fill", d => colorScale(d.category));

        // Thêm nhãn giá trị trên cột
        svg.selectAll(".label")
            .data(transformedData)
            .enter().append("text")
            .attr("class", "label")
            .attr("x", d => xScale(d.revenue / 1_000_000) + 5)
            .attr("y", d => yScale(d.category) + yScale.bandwidth() / 2)
            .attr("dy", ".35em")
            .text(d => `${d3.format(",.0f")(d.revenue / 1_000_000)} triệu VNĐ`);

        // Vẽ trục
        svg.append("g")
            .call(d3.axisLeft(yScale));

        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(xScale).ticks(5).tickFormat(d => `${d}M`));

        // Tooltip
        const tooltip = d3.select("body")
            .append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("background", "white")
            .style("border", "1px solid #ddd")
            .style("padding", "10px")
            .style("border-radius", "5px")
            .style("box-shadow", "0px 0px 5px rgba(0,0,0,0.2)")
            .style("opacity", 0)
            .style("pointer-events", "none");
        
        svg.selectAll(".bar")
            .on("mouseover", (event, d) => {
                tooltip
                    .style("opacity", 1)
                    .html(`
                        <strong>Nhóm hàng:</strong> ${d.category}<br>
                        <strong>Doanh số bán:</strong> ${d3.format(",.0f")(d.revenue / 1_000_000)} triệu VNĐ
                    `)
                    .style("left", (event.pageX + 15) + "px")
                    .style("top", (event.pageY - 10) + "px");
            })
            .on("mousemove", (event) => {
                tooltip
                    .style("left", (event.pageX + 15) + "px")
                    .style("top", (event.pageY - 10) + "px");
            })
            .on("mouseout", () => {
                tooltip.style("opacity", 0);
            });

    }).catch(error => {
        console.error("Lỗi khi đọc CSV:", error);
    });
}