function drawQ12() {
    // Xóa nội dung cũ nhưng giữ lại SVG container
    d3.select("#chart").selectAll("*").remove();
    
    d3.csv("data/data_ggsheet.csv").then(data => {
        // Tính tổng số tiền đã chi trả của từng khách hàng
        const spendingByCustomer = d3.rollup(
            data,
            v => d3.sum(v, d => +d["Thành tiền"]),
            d => d["Mã khách hàng"]
        );

        // Nhóm khách hàng theo khoảng chi tiêu (mỗi khoảng 50,000)
        const binSize = 50000;
        const spendingDistribution = d3.rollup(
            [...spendingByCustomer.values()],
            v => v.length,
            d => Math.floor(d / binSize) * binSize // Gom nhóm theo khoảng 50,000
        );

        // Chuyển đổi dữ liệu thành mảng để vẽ biểu đồ
        let transformedData = Array.from(spendingDistribution, ([spendingRange, customerCount]) => ({
            spendingRange, customerCount
        })).sort((a, b) => a.spendingRange - b.spendingRange);

        // Thiết lập kích thước
        const margin = { top: 50, right: 50, bottom: 80, left: 80 },
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
            .domain(transformedData.map(d => d.spendingRange))
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
            .text("Phân phối mức chi trả của khách hàng");

        // Vẽ cột
        svg.selectAll(".bar")
            .data(transformedData)
            .enter().append("rect")
            .attr("class", "bar")
            .attr("x", d => xScale(d.spendingRange))
            .attr("y", d => yScale(d.customerCount))
            .attr("width", xScale.bandwidth())
            .attr("height", d => height - yScale(d.customerCount))
            .attr("fill", "steelblue")
            .on("mouseover", (event, d) => {
                tooltip
                    .style("opacity", 1)
                    .html(`Đã chi tiêu từ ${d3.format(",")(d.spendingRange)} đến ${d3.format(",")(d.spendingRange + binSize)}<br>
                        Số lượng KH: ${d3.format(",")(d.customerCount)}`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 10) + "px");
            })
            .on("mousemove", (event) => {
                tooltip
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 10) + "px");
            })
            .on("mouseout", () => {
                tooltip.style("opacity", 0);
            });

        svg.append("g")
            .call(d3.axisLeft(yScale).ticks(5));

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
    }).catch(error => {
        console.error("Lỗi khi đọc CSV:", error);
    });
}
