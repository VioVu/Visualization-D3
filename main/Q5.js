function drawQ5() {
    // Xóa nội dung cũ nhưng giữ lại SVG container
    d3.select("#chart").selectAll("*").remove();

    d3.csv("data/data_ggsheet.csv").then(data => {
        // Chuyển đổi dữ liệu thời gian
        data.forEach(d => {
            d["Thời gian tạo đơn"] = new Date(d["Thời gian tạo đơn"]);
            d["Ngày"] = d["Thời gian tạo đơn"].getDate();
        });

        // Tính tổng doanh thu theo từng ngày trong tháng
        const revenueByDay = d3.rollup(
            data,
            v => d3.sum(v, d => +d["Thành tiền"]),
            d => d["Ngày"]
        );

        // Đếm số ngày xuất hiện trong tháng
        const uniqueDaysCount = d3.rollup(
            data,
            v => new Set(v.map(d => d["Thời gian tạo đơn"].toDateString())).size,
            d => d["Ngày"]
        );

        // Chuyển dữ liệu thành mảng
        let transformedData = Array.from(revenueByDay, ([day, revenue]) => ({
            day, 
            revenue,
            revenue_avg: revenue / (uniqueDaysCount.get(day) || 1)
        }));

        // Sắp xếp theo ngày tăng dần (1 → 31)
        transformedData.sort((a, b) => a.day - b.day);
        transformedData.forEach(d => d.dayLabel = `Ngày ${d.day < 10 ? "0" + d.day : d.day}`);

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
            .domain(transformedData.map(d => d.dayLabel))
            .range([0, width])
            .padding(0.1);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(transformedData, d => d.revenue_avg) / 1_000_000])
            .range([height, 0]);

        const colorScale = d3.scaleOrdinal(d3.schemeSet2);

        // Tiêu đề biểu đồ
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", -20)
            .attr("text-anchor", "middle")
            .style("font-size", "22px")
            .style("font-weight", "bold")
            .text("Doanh số bán hàng trung bình theo Ngày trong tháng");

        // Vẽ cột
        svg.selectAll(".bar")
            .data(transformedData)
            .enter().append("rect")
            .attr("class", "bar")
            .attr("x", d => xScale(d.dayLabel))
            .attr("y", d => yScale(d.revenue_avg / 1_000_000))
            .attr("width", xScale.bandwidth())
            .attr("height", d => height - yScale(d.revenue_avg / 1_000_000))
            .attr("fill", d => colorScale(d.dayLabel));

        // Thêm nhãn giá trị trên cột
        svg.selectAll(".label")
            .data(transformedData)
            .enter().append("text")
            .attr("class", "label")
            .attr("x", d => xScale(d.dayLabel) + xScale.bandwidth() / 2)
            .attr("y", d => yScale(d.revenue_avg / 1_000_000) - 5)
            .attr("text-anchor", "middle")
            .style("fill", "black")
            .style("font-size", "12px")
            .style("anchor-weight", "middle")
            .text(d => `${(d.revenue_avg / 1_000_000).toFixed(1)}M`);

        // Vẽ trục
        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(xScale))
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");

        svg.append("g")
            .call(d3.axisLeft(yScale).ticks(5).tickFormat(d => `${d}M`));

        // Thêm tooltip
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
                        ${d.dayLabel}<br>  
                        <strong>Doanh số bán TB:</strong> ${d3.format(",")(Math.round(d.revenue_avg))} VNĐ  
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
