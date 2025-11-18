import {DynamicTablePreview} from "./Size_chart_tables/DynamicTablePreview";

export default function TablePreviewWrapper({
  measurements,
  tolerance,
  grading_rules,
  size_conversion,
  allSizes,
  otherData,
  tableTitle,
  isAIGenerated,
  selectedTable
}) {
    const tableMap = {
    measurement: { data: measurements, title: "Body Measurements", type: "measurements" },
    tolerance: { data: tolerance, title: "Tolerance", type: "tolerance" },
    grading: { data: grading_rules, title: "Grading Rules", type: "grading_rules" },
    international: { data: size_conversion, title: "International Size Conversion", type: "size_conversion" },
  };

  const tableConfig = tableMap[selectedTable];
  if (!tableConfig) return null;
  
  return (
   <DynamicTablePreview
      data={tableConfig.data}
      allSizes={allSizes}
      otherData={otherData}
      tableTitle={tableConfig.title}
      type={tableConfig.type}
      isAIGenerated={isAIGenerated}
    />
  );
}
