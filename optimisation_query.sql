EXPLAIN
SELECT 
    p.packageID,
    p.title,
    p.destinationCountry,
    p.pricePerPerson,
    AVG(r.overallScore) AS avgRating
FROM Package p
LEFT JOIN Review r ON p.packageID = r.packageID
WHERE p.status = 'Active'
AND p.destinationCountry = 'South Africa'
GROUP BY p.packageID
ORDER BY p.pricePerPerson ASC;