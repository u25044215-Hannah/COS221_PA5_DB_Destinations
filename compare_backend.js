document.addEventListener("DOMContentLoaded", async () => {
  const ids = getCompareList();

  const empty = document.getElementById("compare-empty");
  const wrap = document.getElementById("compare-table-wrap");

  console.log("Compare IDs:", ids);

  if (!ids.length) {
    empty.style.display = "block";
    wrap.style.display = "none";
    return;
  }

  const packages = [];

  for (const id of ids) {
    try {
      const json = await apiGet("get_package_details.php", { packageID: id });

      console.log("Package detail response:", json);

      if (json.success && json.package) {
        packages.push(normalisePackage(json.package));
      }
    } catch (err) {
      console.error("Could not load package", id, err);
    }
  }

  if (!packages.length) {
    empty.innerHTML = `
      <div class="compare-empty-icon"></div>
      <h2>Could not load selected packages</h2>
      <p>The package IDs are saved, but the backend details file is not returning data.</p>
      <a href="browse.html" class="btn btn-primary btn-lg" style="margin-top:24px">Browse Packages</a>
    `;
    empty.style.display = "block";
    wrap.style.display = "none";
    return;
  }

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