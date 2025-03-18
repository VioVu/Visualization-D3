function drawQ3() {
    // Xóa nội dung cũ nhưng giữ lại SVG container
    d3.select("#chart").selectAll("*").remove();

    d3.csv("data/data_ggsheet.csv").then(data => {
        // Chuyển đổi dữ liệu: Tính tổng doanh thu theo tháng
        data.forEach(d => {
            d["Thời gian tạo đơn"] = new Date(d["Thời gian tạo đơn"]);
            d["Tháng"] = d["Thời gian tạo đơn"].getMonth() + 1; // Lấy tháng (1-12)
        });

        const revenueByMonth = d3.rollup(
            data, 
            v => d3.sum(v, d => +d["Thành tiền"]), // Tổng doanh thu theo tháng
            d => d["Tháng"]
        );

        // Chuyển dữ liệu thành mảng để dễ vẽ
        let transformedData = Array.from(revenueByMonth, ([month, revenue]) => ({
            month, revenue
        }));

        // Sắp xếp theo thứ tự tháng
        transformedData.sort((a, b) => a.month - b.month);

        // Định dạng tên tháng
        const monthsMapping = [
            "Tháng 01", "Tháng 02", "Tháng 03", "Tháng 04", "Tháng 05", "Tháng 06",
            "Tháng 07", "Tháng 08", "Tháng 09", "Tháng 10", "Tháng 11", "Tháng 12"
        ];
        transformedData.forEach(d => d.monthName = monthsMapping[d.month - 1]);

        // Thiết lập kích thước
        const margin = { top: 50, right: 50, bottom: 50, left: 100 },
              width = 1500 - margin.left - margin.right,
              height = 600 - margin.top - margin.bottom;

        // Cập nhật kích thước SVG
        const svg = d3.select("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);

        // Tạo thang đo
        const xScale = d3.scaleBand()
            .domain(transformedData.map(d => d.monthName))
            .range([0, width])
            .padding(0.1);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(transformedData, d => d.revenue) / 1_000_000])
            .range([height, 0]);

        const colorScale = d3.scaleOrdinal(d3.schemePastel1);

        // Tiêu đề biểu đồ
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", -20)
            .attr("text-anchor", "middle")
            .style("font-size", "22px")
            .style("font-weight", "bold")
            .text("Doanh số bán hàng theo Tháng");

        // Vẽ cột
        svg.selectAll(".bar")
            .data(transformedData)
            .enter().append("rect")
            .attr("class", "bar")
            .attr("x", d => xScale(d.monthName))
            .attr("y", d => yScale(d.revenue / 1_000_000))
            .attr("width", xScale.bandwidth())
            .attr("height", d => height - yScale(d.revenue / 1_000_000))
            .attr("fill", d => colorScale(d.monthName));

        // Thêm nhãn giá trị trên cột
        svg.selectAll(".label")
            .data(transformedData)
            .enter().append("text")
            .attr("class", "label")
            .attr("x", d => xScale(d.monthName) + xScale.bandwidth() / 2)
            .attr("y", d => yScale(d.revenue / 1_000_000) - 2)
            .attr("text-anchor", "middle")
            .text(d => `${d3.format(",.0f")(d.revenue / 1_000_000)} triệu VND`);

        // Vẽ trục
        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(xScale));

        svg.append("g")
            .call(d3.axisLeft(yScale).ticks(5).tickFormat(d => `${d}M`));
        
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
                       ${d.monthName}<br>
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
