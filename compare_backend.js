document.addEventListener("DOMContentLoaded", async () => {
    const ids = getCompareList();
  
    const empty = document.getElementById("compare-empty");
    const wrap = document.getElementById("compare-table-wrap");
  
    if (!ids.length) return;
  
    const packages = [];
  
    for (const id of ids) {
      const json = await apiGet("get_package_details.php", { packageID: id });
  
      if (json.success) {
        packages.push(normalisePackage(json.package));
      }
    }
  
    if (!packages.length) return;
  
    empty.style.display = "none";
    wrap.style.display = "block";
  
    document.getElementById("compare-count-label").textContent =
      `${packages.length} package(s) selected`;
  
    document.getElementById("compare-header-row").innerHTML =
      `<th class="compare-row-label">Package</th>` +
      packages.map(p => `<th>${p.name}</th>`).join("");
  
    const rows = [
      ["Destination", p => p.destination],
      ["Price", p => money(p.price, p.currency)],
      ["Duration", p => `${p.duration} days`],
      ["Rating", p => `${p.rating.toFixed(1)} ★`],
      ["Agency", p => p.agency]
    ];
  
    document.getElementById("compare-tbody").innerHTML = rows.map(([label, fn]) => `
      <tr>
        <td class="compare-row-label">${label}</td>
        ${packages.map(p => `<td>${fn(p)}</td>`).join("")}
      </tr>
    `).join("");
  
    document.getElementById("compare-book-row").innerHTML =
      packages.map(p => `
        <a class="btn btn-primary btn-sm" href="package-detail.html?packageID=${p.id}">
          View ${p.name}
        </a>
      `).join(" ");
  
    document.getElementById("clear-compare-all")?.addEventListener("click", () => {
      setCompareList([]);
      location.reload();
    });
  });