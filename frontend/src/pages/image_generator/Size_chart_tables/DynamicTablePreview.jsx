// Add this helper function at the top of your component or in a separate utils file
const sortGarmentSizes = (sizes) => {
  // Define the standard order for garment sizes
const sizeOrder = {
  // Numeric baby/toddler sizes (months)
  '3M': 1, '6M': 2, '9M': 3, '12M': 4, '18M': 5, '24M': 6,
  
  // Toddler sizes
  '2T': 7, '3T': 8, '4T': 9, '5T': 10,
  
  // Numeric kid sizes (years)
  '2': 11, '3': 12, '4': 13, '5': 14, '6': 15, '7': 16, '8': 17, 
  '9': 18, '10': 19, '11': 20, '12': 21, '13': 22, '14': 23, '16': 24,
  
  // Year-based kid sizes
  '2Y': 11, '3Y': 12, '4Y': 13, '5Y': 14, '6Y': 15, '7Y': 16, '8Y': 17,
  '9Y': 18, '10Y': 19, '11Y': 20, '12Y': 21, '13Y': 22, '14Y': 23, '16Y': 24,
  
  // Standard adult sizes
  'XXS': 100, 'XS': 101, 'S': 102, 'SM': 102.5, 'M': 103, 'ML': 103.5, 'L': 104, 
  'XL': 105, 'XXL': 106, '2XL': 107, '3XL': 108, '4XL': 109, '5XL': 110,
  
  // Additional variations (common hybrid sizes)
  'XS-S': 101.5, 'S-M': 102.25, 'M-L': 103.25, 'L-XL': 104.5,
  
  // Numeric adult sizes (waist/chest sizes)
  '26': 200, '28': 201, '30': 202, '32': 203, '34': 204, '36': 205,
  '38': 206, '40': 207, '42': 208, '44': 209, '46': 210, '48': 211, '50': 212
};

  return [...sizes].sort((a, b) => {
    const aOrder = sizeOrder[a.toUpperCase()] ?? 999;
    const bOrder = sizeOrder[b.toUpperCase()] ?? 999;
    
    // If both sizes are in our predefined order, use that
    if (aOrder !== 999 && bOrder !== 999) {
      return aOrder - bOrder;
    }
    
    // If one is defined and other isn't, prioritize the defined one
    if (aOrder !== 999) return -1;
    if (bOrder !== 999) return 1;
    
    // For any unknown sizes, keep them in their original order
    return 0;
  });
};

// Then update your component:
export function DynamicTablePreview({ 
  data, 
  type, 
  otherData, 
  tableTitle, 
  isAIGenerated, 
  allSizes 
}) {

  if (!data || Object.keys(data).length === 0) {
    return <p>No {type.replace("_", " ")} available.</p>;
  }

  const renderCellValue = (val) => {
    if (val === null || val === undefined) return "-";
    if (typeof val === "object") return val.Rule ?? JSON.stringify(val);
    return val;
  };

  // Sort the sizes properly
  const sortedSizes = sortGarmentSizes(allSizes || []);


  const renderTable = () => {
    switch (type) {
      case "measurements":
        return (
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-1 border-r font-normal">Measurement</th>
                {sortedSizes.slice(0, 4).map((size) => (
                  <th key={size} className="text-center p-1 border-r font-normal">{size}</th>
                ))}
                {sortedSizes.length > 4 && <th className="text-center p-1">...</th>}
              </tr>
            </thead>
            <tbody>
              {Object.entries(data).slice(0, 3).map(([point, sizeValues]) => (
                <tr key={point} className="border-b">
                  <td className="p-1 border-r capitalize text-xs">{point.replace(/_/g, " ")}</td>
                  {sortedSizes.slice(0, 4).map((size) => (
                    <td key={size} className="text-center p-1 border-r text-xs">{sizeValues[size] || "-"}</td>
                  ))}
                  {sortedSizes.length > 4 && <td className="text-center p-1 text-xs">...</td>}
                </tr>
              ))}
              {Object.keys(data).length > 3 && (
                <tr>
                  <td colSpan={Math.min(sortedSizes.length + 1, 6)} className="text-center p-1 text-xs">
                    ... {Object.keys(data).length - 3} more rows
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        );

      case "tolerance":
        return (
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-1 border-r font-normal">Measurement</th>
                <th className="text-center p-1 font-normal">Tolerance</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(data).map(([point, value]) => (
                <tr key={point} className="border-b">
                  <td className="p-1 border-r capitalize text-xs">{point.replace(/_/g, " ")}</td>
                  <td className="text-center p-1 text-xs">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      case "grading_rules":
        return (
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-1 border-r font-normal">Measuremen1t Point</th>
                <th className="text-center p-1 font-normal">Grade Value</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(data).map(([point, value]) => (
                <tr key={point} className="border-b">
                  <td className="p-1 border-r capitalize text-xs">{point.replace(/_/g, " ")}</td>
                  <td className="text-center p-1 text-xs">{renderCellValue(value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      case "size_conversion":
        const regions = Object.keys(data[Object.keys(data)[0]] || {});
        return (
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-1 border-r font-normal">Size</th>
                {regions.map((region) => (
                  <th key={region} className="text-center p-1 border-r font-normal">{region}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(data).map(([size, conversions]) => (
                <tr key={size} className="border-b">
                  <td className="p-1 border-r capitalize text-xs">{size}</td>
                  {regions.map((region) => (
                    <td key={region} className="text-center p-1 border-r text-xs">{conversions[region] || "-"}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        );

      default:
        return <p>Unknown table type</p>;
    }
  };

  return (
    <div className="overflow-auto max-w-full">
      {tableTitle && <h4 className="font-medium mb-2">{tableTitle}</h4>}
      {renderTable()}
      <div className="mt-2 text-xs text-gray-200 flex gap-3">
        {otherData?.market && <p><strong>Market:</strong> {otherData.market}</p>}
        {otherData?.unit && <p><strong>Unit:</strong> {otherData.unit}</p>}
      </div>
    </div>
  );
}
