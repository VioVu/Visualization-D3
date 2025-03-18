function drawQ4() {
    // Xóa nội dung cũ nhưng giữ lại SVG container
    d3.select("#chart").selectAll("*").remove();

    d3.csv("data/data_ggsheet.csv").then(data => {
        // Chuyển đổi dữ liệu
        data.forEach(d => {
            d["Thời gian tạo đơn"] = new Date(d["Thời gian tạo đơn"]);
            d["Thứ"] = d["Thời gian tạo đơn"].getDay(); // 0: Chủ Nhật, 1: Thứ Hai, ...
        });

        // Định nghĩa thứ tự ngày trong tuần theo yêu cầu (Thứ Hai → Chủ Nhật)
        const weekdays = ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ Nhật"];
        const weekdayOrder = {1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 0: 6}; // Map để sắp xếp

        // Tính tổng doanh thu theo từng ngày trong tuần
        const revenueByDay = d3.rollup(
            data,
            v => d3.sum(v, d => +d["Thành tiền"]),
            d => d["Thứ"]
        );

        // Đếm số lần xuất hiện của từng thứ trong năm (distinct ngày)
        const uniqueDaysCount = d3.rollup(
            data,
            v => new Set(v.map(d => d["Thời gian tạo đơn"].toDateString())).size,
            d => d["Thứ"]
        );

        // Chuyển dữ liệu thành mảng và tính doanh thu trung bình
        let transformedData = Array.from(revenueByDay, ([day, revenue]) => ({
            day, 
            revenue,
            revenue_avg: revenue / (uniqueDaysCount.get(day) || 1) // Tránh chia cho 0
        }));

        // Sắp xếp theo Thứ Hai → Chủ Nhật
        transformedData.sort((a, b) => weekdayOrder[a.day] - weekdayOrder[b.day]);
        transformedData.forEach(d => d.dayLabel = weekdays[weekdayOrder[d.day]]);

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
            .domain([0, d3.max(transformedData, d => d.revenue_avg)/ 1_000_000])
            .range([height, 0]);

        const colorScale = d3.scaleOrdinal(d3.schemeSet2);

        // Tiêu đề biểu đồ
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", -30)
            .attr("text-anchor", "middle")
            .style("font-size", "22px")
            .style("font-weight", "bold")
            .text("Doanh thu trung bình theo Ngày trong tuần");

        // Vẽ cột
        svg.selectAll(".bar")
            .data(transformedData)
            .enter().append("rect")
            .attr("class", "bar")
            .attr("x", d => xScale(d.dayLabel))
            .attr("y", d => yScale(d.revenue_avg/ 1_000_000))
            .attr("width", xScale.bandwidth())
            .attr("height", d => height - yScale(d.revenue_avg / 1_000_000))
            .attr("fill", d => colorScale(d.dayLabel));
  
        // Thêm nhãn giá trị trên cột
        svg.selectAll(".label")
            .data(transformedData)
            .enter().append("text")
            .attr("class", "label")
            .attr("x", d => xScale(d.dayLabel) + xScale.bandwidth() / 2)
            .attr("y", d => yScale(d.revenue_avg/1_000_000) - 5)
            .attr("text-anchor", "middle")
            .text(d => `${d3.format(",")(Math.round(d.revenue_avg))} VNĐ`);

        // Vẽ trục
        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(xScale));

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
