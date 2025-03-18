function drawQ1() {
    // Xóa nội dung cũ nhưng giữ lại SVG container
    d3.select("#chart").selectAll("*").remove();

    // Đọc dữ liệu từ file CSV
    d3.csv("data/data_ggsheet.csv").then(data => {
        // Chuyển đổi dữ liệu: Tính tổng doanh thu cho từng mặt hàng
        const revenueByItem = d3.rollup(data, 
            v => d3.sum(v, d => +d["Thành tiền"]),  // Tính tổng thành tiền
            d => `[${d["Mã mặt hàng"]}] ${d["Tên mặt hàng"]}`,  // Mặt hàng mới
            d => `[${d["Mã nhóm hàng"]}] ${d["Tên nhóm hàng"]}`  // Nhóm hàng mới
        );

        // Chuyển dữ liệu thành mảng để dễ vẽ
        let transformedData = [];
        revenueByItem.forEach((group, item) => {
            group.forEach((value, category) => {
                transformedData.push({ name: item, revenue: value, category: category });
            });
        });

        // Sắp xếp theo doanh thu giảm dần
        transformedData.sort((a, b) => b.revenue - a.revenue);

        // Thiết lập kích thước
        const margin = { top: 50, right: 400, bottom: 50, left: 350 };
        const width = 1400 - margin.left - margin.right;
        const height = transformedData.length * 30;

        // Tạo SVG mới
        const svg = d3.select("#chart")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);
        svg.append("text")
            .attr("x", width / 2) // Căn giữa theo chiều rộng
            .attr("y", -20)  // Đưa tiêu đề lên trên
            .attr("text-anchor", "middle")
            .style("font-size", "22px")
            .style("font-weight", "bold")
            .text("Doanh thu của mặt hàng theo nhóm hàng");
        
        // Tạo thang đo
        const xScale = d3.scaleLinear()
            .domain([0, d3.max(transformedData, d => d.revenue) / 1_000_000]) // Chia thành M
            .range([0, width]);

        const yScale = d3.scaleBand()
            .domain(transformedData.map(d => d.name))
            .range([0, height])
            .padding(0.1);

        const colorScale = d3.scaleOrdinal(d3.schemeSet2);

        // Vẽ cột
        svg.selectAll(".bar")
            .data(transformedData)
            .enter().append("rect")
            .attr("class", "bar")
            .attr("y", d => yScale(d.name))
            .attr("x", 0)
            .attr("height", yScale.bandwidth())
            .attr("width", d => xScale(d.revenue / 1_000_000)) // Chia thành M
            .attr("fill", d => colorScale(d.category));

        // Thêm nhãn giá trị trên cột (triệu đồng)
        svg.selectAll(".label")
            .data(transformedData)
            .enter().append("text")
            .attr("class", "label")
            .attr("x", d => xScale(d.revenue / 1_000_000) + 5)
            .attr("y", d => yScale(d.name) + yScale.bandwidth() / 2)
            .attr("dy", ".35em")
            .text(d => `${d3.format(",.0f")(d.revenue / 1_000_000)} triệu VNĐ`);

        // Vẽ trục
        svg.append("g")
            .call(d3.axisLeft(yScale));

        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(xScale).ticks(5).tickFormat(d => `${d}M`)); // Trục X hiển thị M

        // Tạo legend (Nhóm hàng)
        const legend = svg.append("g")
            .attr("transform", `translate(${width + 90}, 50)`);

        const categories = Array.from(new Set(transformedData.map(d => d.category)));

        legend.append("text")
            .attr("x", 0)
            .attr("y", -10)
            .text("Nhóm hàng")
            .style("font-size", "18px")
            .style("font-weight", "bold");

        const tooltip = d3.select("body")
            .append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("background", "white")
            .style("border", "1px solid #ddd")
            .style("padding", "10px")
            .style("border-radius", "5px")
            .style("box-shadow", "0px 0px 5px rgba(0,0,0,0.2)")
            .style("opacity", 0) // Ẩn ban đầu
            .style("pointer-events", "none"); // Tránh xung đột khi hover
        
        svg.selectAll(".bar")
            .on("mouseover", (event, d) => {
                tooltip
                    .style("opacity", 1) // Hiển thị tooltip
                    .html(`
                        <strong>Mặt hàng:</strong> ${d.name}<br>
                        <strong>Nhóm hàng:</strong> ${d.category}<br>
                        <strong>Doanh số bán:</strong> ${d3.format(",.0f")(d.revenue / 1_000_000)} triệu VND
                    `)
                    .style("left", (event.pageX + 15) + "px") // Cập nhật vị trí
                    .style("top", (event.pageY - 10) + "px");
            })
            .on("mousemove", (event) => {
                tooltip
                    .style("left", (event.pageX + 15) + "px")
                    .style("top", (event.pageY - 10) + "px");
            })
            .on("mouseout", () => {
                tooltip.style("opacity", 0); // Ẩn tooltip khi rời chuột
            });

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
                // Kiểm tra trạng thái hiện tại
                const active = d3.selectAll(".bar").filter(d => d.category === category).classed("active");
                
                // Reset tất cả trước khi highlight
                d3.selectAll(".bar").style("opacity", 0.3);
                d3.selectAll("text.label").style("opacity", 0.3);
        
                if (!active) {
                    d3.selectAll(".bar").filter(d => d.category === category)
                        .style("opacity", 1)
                        .classed("active", true);
                    
                    d3.selectAll("text.label").filter(d => d.category === category)
                        .style("opacity", 1);
                } else {
                    d3.selectAll(".bar").style("opacity", 1).classed("active", false);
                    d3.selectAll("text.label").style("opacity", 1);
                }
            });
        
        legend.selectAll("text.legend")
            .data(categories)
            .enter().append("text")
            .attr("x", 20)
            .attr("y", (d, i) => i * 20 + 12)
            .text(d => d)
            .attr("class", "legend");

    }).catch(error => {
        console.error("Lỗi khi đọc CSV:", error);
    });
}
