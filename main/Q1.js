function drawQ1() {

    d3.select("#chart").selectAll("*").remove();

    d3.csv("data/data_ggsheet.csv").then(data => {
        
        const revenueByItem = d3.rollup(data, 
            v => d3.sum(v, d => +d["Thành tiền"]),  
            d => `[${d["Mã mặt hàng"]}] ${d["Tên mặt hàng"]}`, 
            d => `[${d["Mã nhóm hàng"]}] ${d["Tên nhóm hàng"]}`  
        );

 
        let transformedData = [];
        revenueByItem.forEach((group, item) => {
            group.forEach((value, category) => {
                transformedData.push({ name: item, revenue: value, category: category });
            });
        });

       
        transformedData.sort((a, b) => b.revenue - a.revenue);

   
        const margin = { top: 50, right: 400, bottom: 50, left: 350 };
        const width = 1400 - margin.left - margin.right;
        const height = transformedData.length * 30;

 
        const svg = d3.select("#chart")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);
        svg.append("text")
            .attr("x", width / 2) 
            .attr("y", -20)  
            .attr("text-anchor", "middle")
            .style("font-size", "22px")
            .style("font-weight", "bold")
            .text("Doanh thu của mặt hàng theo nhóm hàng");
        

        const xScale = d3.scaleLinear()
            .domain([0, d3.max(transformedData, d => d.revenue) / 1_000_000]) 
            .range([0, width]);

        const yScale = d3.scaleBand()
            .domain(transformedData.map(d => d.name))
            .range([0, height])
            .padding(0.1);

        const colorScale = d3.scaleOrdinal(d3.schemeSet2);

  
        svg.selectAll(".bar")
            .data(transformedData)
            .enter().append("rect")
            .attr("class", "bar")
            .attr("y", d => yScale(d.name))
            .attr("x", 0)
            .attr("height", yScale.bandwidth())
            .attr("width", d => xScale(d.revenue / 1_000_000)) 
            .attr("fill", d => colorScale(d.category));

     
        svg.selectAll(".label")
            .data(transformedData)
            .enter().append("text")
            .attr("class", "label")
            .attr("x", d => xScale(d.revenue / 1_000_000) + 5)
            .attr("y", d => yScale(d.name) + yScale.bandwidth() / 2)
            .attr("dy", ".35em")
            .text(d => `${d3.format(",.0f")(d.revenue / 1_000_000)} triệu VNĐ`);

       
        svg.append("g")
            .call(d3.axisLeft(yScale));

        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(xScale).ticks(5).tickFormat(d => `${d}M`)); 


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
            .style("opacity", 0) 
            .style("pointer-events", "none"); 
        
        svg.selectAll(".bar")
            .on("mouseover", (event, d) => {
                tooltip
                    .style("opacity", 1)
                    .html(`
                        <strong>Mặt hàng:</strong> ${d.name}<br>
                        <strong>Nhóm hàng:</strong> ${d.category}<br>
                        <strong>Doanh số bán:</strong> ${d3.format(",.0f")(d.revenue / 1_000_000)} triệu VND
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
                
                const active = d3.selectAll(".bar").filter(d => d.category === category).classed("active");
                
              
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
