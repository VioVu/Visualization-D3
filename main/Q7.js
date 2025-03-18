function drawQ7() {
    d3.select("#chart").selectAll("*").remove();

    d3.csv("data/data_ggsheet.csv").then(data => {
        // Lấy danh sách Mã đơn hàng duy nhất
        let totalDistinctOrders = new Set(data.map(d => d["Mã đơn hàng"])).size;

        // Tính số lượng Mã đơn hàng duy nhất theo Nhóm hàng
        let ordersByCategory = d3.rollup(
            data,
            v => new Set(v.map(d => d["Mã đơn hàng"])).size,  // Đếm số đơn hàng duy nhất
            d =>  `[${d["Mã nhóm hàng"]}] ${d["Tên nhóm hàng"]}`
        );

        // Chuyển đổi thành mảng để dễ xử lý
        let transformedData = Array.from(ordersByCategory, ([category, count]) => ({
            category,
            probability: count / totalDistinctOrders * 100  // Xác suất theo %
        }));

        // Sắp xếp theo xác suất giảm dần
        transformedData.sort((a, b) => b.probability - a.probability);

        // Thiết lập kích thước biểu đồ
        const margin = { top: 50, right: 50, bottom: 50, left: 200 },
            width = 1500 - margin.left - margin.right,
            height = 600 - margin.top - margin.bottom;

        // Cập nhật kích thước SVG
        const svg = d3.select("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);

        // Thang đo
        const xScale = d3.scaleLinear()
            .domain([0, d3.max(transformedData, d => d.probability)])
            .range([0, width]);

        const yScale = d3.scaleBand()
            .domain(transformedData.map(d => d.category))
            .range([0, height])
            .padding(0.2);

        const colorScale = d3.scaleOrdinal(d3.schemeSet2);

        // Tiêu đề
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", -20)
            .attr("text-anchor", "middle")
            .style("font-size", "22px")
            .style("font-weight", "bold")
            .text("Xác suất bán hàng theo Nhóm hàng");

        // Vẽ thanh ngang
        svg.selectAll(".bar")
            .data(transformedData)
            .enter().append("rect")
            .attr("class", "bar")
            .attr("x", 0)
            .attr("y", d => yScale(d.category))
            .attr("width", d => xScale(d.probability))
            .attr("height", yScale.bandwidth())
            .attr("fill", d => colorScale(d.category));

        // Nhãn phần trăm
        svg.selectAll(".label")
            .data(transformedData)
            .enter().append("text")
            .attr("class", "label")
            .attr("x", d => xScale(d.probability) + 5)
            .attr("y", d => yScale(d.category) + yScale.bandwidth() / 2)
            .attr("dy", "0.35em")
            .style("fill", "black")
            .style("font-size", "14px")
            .text(d => `${d.probability.toFixed(1)}%`);

        // Trục
        svg.append("g")
            .call(d3.axisLeft(yScale));

        svg.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(xScale).ticks(5).tickFormat(d => `${d}%`));
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
                        <strong>Xác suất mua hàng:</strong> ${d3.format(".1f")(d.probability)}%
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
