// compare_backend.js

document.addEventListener("DOMContentLoaded", async () => {
  const ids = JSON.parse(localStorage.getItem("comparePackages")) || [];

  const empty = document.getElementById("compare-empty");
  const wrap = document.getElementById("compare-table-wrap");

  if (!ids.length) {
    empty.style.display = "block";
    wrap.style.display = "none";
    return;
  }

  try {
    const json = await apiGet("api.php", { action: "getPackages" });
    const allPackages = json.data || json.packages || json || [];

    const packages = allPackages
      .filter(pkg => ids.includes(String(pkg.packageID || pkg.PackageID || pkg.id)))
      .map(pkg => ({
        id: pkg.packageID || pkg.PackageID || pkg.id,
        name: pkg.packageName || pkg.title || "Travel Package",
        destination: [pkg.destinationCity || pkg.city, pkg.destinationCountry || pkg.country]
          .filter(Boolean)
          .join(", "),
        price: Number(pkg.pricePerPerson || pkg.price || pkg.packagePrice || 0),
        currency: pkg.currency || "ZAR",
        duration: pkg.durationDays || pkg.duration || 0,
        rating: Number(pkg.averageRating || pkg.rating || 0),
        agency: pkg.agencyName || pkg.companyName || "Travel Agency"
      }));

    if (!packages.length) {
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
      ["Destination", p => p.destination || "—"],
      ["Price", p => `R ${p.price.toLocaleString()}`],
      ["Duration", p => `${p.duration} days`],
      ["Rating", p => `${p.rating.toFixed(1)} ★`],
      ["Agency", p => p.agency || "—"]
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

  } catch (err) {
    console.error("Compare loading failed:", err);
    empty.style.display = "block";
    wrap.style.display = "none";
  }

  document.getElementById("clear-compare-all")?.addEventListener("click", () => {
    localStorage.removeItem("comparePackages");
    location.reload();
  });
});