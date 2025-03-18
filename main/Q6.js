function drawQ6() {
    // Xóa nội dung cũ nhưng giữ lại SVG container
    d3.select("#chart").selectAll("*").remove();

    d3.csv("data/data_ggsheet.csv").then(data => {
        // Chuyển đổi dữ liệu thời gian và tạo cột khung giờ + cột ngày
        data.forEach(d => {
            let date = new Date(d["Thời gian tạo đơn"]);
            let hour = date.getHours();
            d["Khung giờ"] = `${hour}:00-${hour}:59`;
            d["Ngày"] = date.toISOString().split("T")[0]; // Lấy ngày dạng YYYY-MM-DD
        });

        // Đếm số ngày khác nhau mà khung giờ xuất hiện
        const uniqueDaysCount = d3.rollup(
            data,
            v => new Set(v.map(d => d["Ngày"])).size, // Lấy số lượng ngày duy nhất
            d => d["Khung giờ"]
        );

        // Nhóm dữ liệu theo khung giờ và tính tổng doanh thu
        const revenueByHour = d3.rollup(
            data,
            v => d3.sum(v, d => +d["Thành tiền"]),
            d => d["Khung giờ"]
        );

        // Chuyển đổi dữ liệu thành mảng
        let transformedData = Array.from(revenueByHour, ([hour, revenue]) => ({
            hour,
            revenue,
            revenue_avg: revenue / (uniqueDaysCount.get(hour) || 1) // Chia cho số ngày duy nhất
        }));


        // Sắp xếp theo thứ tự thời gian
        transformedData.sort((a, b) => {
            return parseInt(a.hour.split(":")[0]) - parseInt(b.hour.split(":")[0]);
        });

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
            .domain(transformedData.map(d => d.hour))
            .range([0, width])
            .padding(0.1);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(transformedData, d => d.revenue_avg)/1_000])
            .range([height, 0]);

        const colorScale = d3.scaleOrdinal(d3.schemeSet2);

        // Tiêu đề biểu đồ
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", -20)
            .attr("text-anchor", "middle")
            .style("font-size", "22px")
            .style("font-weight", "bold")
            .text("Doanh số bán hàng trung bình theo Khung giờ");

        // Vẽ cột
        svg.selectAll(".bar")
            .data(transformedData)
            .enter().append("rect")
            .attr("class", "bar")
            .attr("x", d => xScale(d.hour))
            .attr("y", d => yScale(d.revenue_avg/1_000))
            .attr("width", xScale.bandwidth())
            .attr("height", d => height - yScale(d.revenue_avg/1_000))
            .attr("fill", d => colorScale(d.hour));

        // Thêm nhãn giá trị trên cột
        svg.selectAll(".label")
            .data(transformedData)
            .enter().append("text")
            .attr("class", "label")
            .attr("x", d => xScale(d.hour) + xScale.bandwidth() / 2)
            .attr("y", d => yScale(d.revenue_avg/1_000) - 5)
            .attr("text-anchor", "middle")
            .style("fill", "black")
            .style("font-size", "12px")
            .style("anchor-weight", "middle")
            .text(d => `${(d.revenue_avg / 1_000).toFixed(1)}K`);
   
        // Vẽ trục
        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(xScale));
        svg.append("g")
            .call(d3.axisLeft(yScale).ticks(5).tickFormat(d => `${d3.format(",")(d)}K`));
        

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
                        <strong>${d.hour}</strong><br>
                        <strong>Doanh số TB:</strong> ${d3.format(",")(Math.round(d.revenue_avg))} VNĐ  
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
