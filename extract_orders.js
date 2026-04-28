
(async () => {
  const response = await fetch('https://docs.google.com/spreadsheets/d/1db3-_UcVlrohgxk3r2A367Hj12DfM03Vhb4xUqdEeVw/export?format=csv&gid=1564590942');
  const text = await response.text();
  
  function parseCSV(text) {
    const rows = [];
    let row = [];
    let col = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i+1];
      if (char === '"' && inQuotes && nextChar === '"') {
        col += '"';
        i++;
      } else if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        row.push(col.trim());
        col = '';
      } else if (char === '\r') {
        continue;
      } else if (char === '\n' && !inQuotes) {
        row.push(col.trim());
        rows.push(row);
        row = [];
        col = '';
      } else {
        col += char;
      }
    }
    if (row.length > 0 || col !== '') {
      row.push(col.trim());
      rows.push(row);
    }
    return rows;
  }
  
  const rows = parseCSV(text);
  const results = [];
  let currentBrand = '';
  
  // Possible brands are known: Dote, Moquette, Cuire, etc.
  const knownBrands = ['Dote', 'Moquette', 'Cuire'];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length < 5) continue;
    
    let date = row[0];
    let possibleBrand = row[3];
    
    if (possibleBrand && possibleBrand.trim()) {
      currentBrand = possibleBrand.trim();
    }
    
    // Check if the date contains 2026
    if (date && (date.endsWith('/2026') || date.includes('/2026/'))) {
      results.push({
        brand: currentBrand,
        orderDate: date,
        size: row[1],
        customerName: row[4],
        customerPhone: row[5],
        customerAddress: row[6],
        parcelNumber: row[10] || null, // Check remark column for parcel number if any
        status: "SHIPPED"
      });
    }
  }
  return { count: results.length, data: results };
})()
