function drawQ8() {
    d3.select("#chart").selectAll("*").remove(); // Xóa biểu đồ cũ nếu có

    d3.csv("data/data_ggsheet.csv").then(data => {
        // Chuyển đổi dữ liệu: Trích xuất tháng từ "Thời gian tạo đơn"
        data.forEach(d => {
            if (d["Thời gian tạo đơn"]) {
                let date = new Date(d["Thời gian tạo đơn"]);
                d["Tháng"] = date.getMonth() + 1; // Lấy số tháng (1-12)
                d["Nhóm hàng"] = `[${d["Mã nhóm hàng"]}] ${d["Tên nhóm hàng"]}`;
            }
        });

        // Tính tổng số đơn hàng duy nhất theo từng tháng
        let totalOrdersByMonth = d3.rollup(
            data,
            v => new Set(v.map(d => d["Mã đơn hàng"])).size,
            d => d["Tháng"]
        );

        // Tính số đơn hàng duy nhất theo Nhóm hàng & Tháng
        let ordersByCategoryMonth = d3.rollup(
            data,
            v => new Set(v.map(d => d["Mã đơn hàng"])).size,
            d => d["Nhóm hàng"],
            d => d["Tháng"]
        );

        // Chuyển đổi thành mảng để dễ xử lý
        let transformedData = [];
        ordersByCategoryMonth.forEach((months, category) => {
            months.forEach((count, month) => {
                transformedData.push({
                    category,
                    month,
                    probability: (count / totalOrdersByMonth.get(month)) * 100
                });
            });
        });

        // Sắp xếp dữ liệu theo tháng tăng dần (1 → 12)
        transformedData.sort((a, b) => d3.ascending(a.month, b.month));

        // Danh sách tháng theo thứ tự tăng dần
        const uniqueMonths = [...new Set(transformedData.map(d => d.month))].sort(d3.ascending);

        // Kích thước biểu đồ
        const margin = { top: 50, right: 200, bottom: 50, left: 100 };
        const width = 1200 - margin.left - margin.right;
        const height = 500;

        // Tạo hoặc cập nhật SVG
        const svg = d3.select("#chart")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);

        // Thang đo trục X (Tháng)
        const xScale = d3.scalePoint()
            .domain(uniqueMonths.map(m => `Tháng ${m}`))
            .range([0, width])
            .padding(0.5);

        // Thang đo trục Y (Xác suất %), tối đa là 70%
        const yScale = d3.scaleLinear()
            .domain([0, 70]) // Giới hạn max là 70%
            .range([height, 0]);
        // Tiêu đề
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", -20)
            .attr("text-anchor", "middle")
            .style("font-size", "22px")
            .style("font-weight", "bold")
            .text("Xác suất bán hàng của Mặt hàng theo Nhóm hàng");
            
        // Nhóm dữ liệu theo category
        const nestedData = d3.group(transformedData, d => d.category);

        // Tạo màu sắc
        const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

        // Vẽ đường line chart
        const line = d3.line()
            .x(d => xScale(`Tháng ${d.month}`))
            .y(d => yScale(d.probability))
            .curve(d3.curveMonotoneX);

        nestedData.forEach((values, category) => {
            svg.append("path")
                .datum(values)
                .attr("fill", "none")
                .attr("stroke", colorScale(category))
                .attr("stroke-width", 2)
                .attr("class", "line")
                .attr("data-category", category)
                .attr("d", line);

            // Vẽ điểm tròn (circle)
            svg.selectAll(`.dot-${category}`)
                .data(values)
                .enter().append("circle")
                .attr("cx", d => xScale(`Tháng ${d.month}`))
                .attr("cy", d => yScale(d.probability))
                .attr("r", 5)
                .attr("fill", colorScale(category))
                .attr("class", "dot")
                .attr("data-category", category)
                .on("mouseover", function (event, d) {
                    tooltip.style("opacity", 1)
                        .html(`<strong>Tháng ${d.month} | ${d.category}</strong><br>SL Đơn Bán: ${d3.format(",.0f")(d.probability)}%`)
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 20) + "px");
                    d3.select(this).attr("r", 7);
                })
                .on("mousemove", function (event) {
                    tooltip.style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 20) + "px");
                })
                .on("mouseout", function () {
                    tooltip.style("opacity", 0);
                    d3.select(this).attr("r", 5);
                });
        });

        // Vẽ trục X
        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(xScale));

        // Vẽ trục Y
        svg.append("g")
            .call(d3.axisLeft(yScale).ticks(10).tickFormat(d => `${d}%`));

        // Thêm tooltip
        let tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("background", "white")
            .style("border", "1px solid #ddd")
            .style("padding", "10px")
            .style("border-radius", "5px")
            .style("box-shadow", "0px 0px 5px rgba(0,0,0,0.2)")
            .style("opacity", 0)
            .style("pointer-events", "none");

        // Tạo legend
        const legend = svg.append("g")
            .attr("transform", `translate(${width + 20}, 0)`);

        const categories = Array.from(nestedData.keys());

        legend.selectAll("rect")
            .data(categories)
            .enter().append("rect")
            .attr("x", 0)
            .attr("y", (d, i) => i * 20)
            .attr("width", 15)
            .attr("height", 15)
            .attr("fill", d => colorScale(d))
            .style("cursor", "pointer")
            .on("click", (event, category) => {
                const isActive = d3.selectAll(`.line[data-category='${category}']`).classed("active");

                d3.selectAll(".line, .dot").style("opacity", 0.2);
                if (!isActive) {
                    d3.selectAll(`.line[data-category='${category}']`).style("opacity", 1).classed("active", true);
                    d3.selectAll(`.dot[data-category='${category}']`).style("opacity", 1);
                } else {
                    d3.selectAll(".line, .dot").style("opacity", 1).classed("active", false);
                }
            });

        legend.selectAll("text")
            .data(categories)
            .enter().append("text")
            .attr("x", 20)
            .attr("y", (d, i) => i * 20 + 12)
            .text(d => d)
            .style("cursor", "pointer")
            .on("click", (event, category) => {
                d3.select(`rect[fill='${colorScale(category)}']`).dispatch("click");
            });

    }).catch(error => console.error("Lỗi khi đọc CSV:", error));
}
