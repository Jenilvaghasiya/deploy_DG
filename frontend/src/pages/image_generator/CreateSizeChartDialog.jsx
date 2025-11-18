import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Save, X, Trash2, Eye } from "lucide-react";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter, TableCaption } from "@/components/ui/table";
import { Label } from "@/components/ui/label";

const TABLE_TYPES = {
  MEASUREMENTS: "measurements",
  GRADING_RULES: "grading_rules",
  TOLERANCE: "tolerance",
  SIZE_CONVERSION: "size_conversion",
};

const TABLE_CONFIG = {
  [TABLE_TYPES.MEASUREMENTS]: {
    rowLabel: "Measurement Point",
    columnLabel: "Size",
    rowPlaceholder: "New Measurement Point",
    columnPlaceholder: "New Size",
    maxColumns: null,
  },
  [TABLE_TYPES.GRADING_RULES]: {
    rowLabel: "Grading Rule",
    columnLabel: "Size",
    rowPlaceholder: "New Grading Rule",
    columnPlaceholder: "New Size",
    maxColumns: 1,
  },
  [TABLE_TYPES.TOLERANCE]: {
    rowLabel: "Tolerance Point",
    columnLabel: "Size",
    rowPlaceholder: "New Tolerance Point",
    columnPlaceholder: "New Size",
    maxColumns: 1,
  },
  [TABLE_TYPES.SIZE_CONVERSION]: {
    rowLabel: "Size System",
    columnLabel: "Size",
    rowPlaceholder: "New Size System",
    columnPlaceholder: "New Size",
    maxColumns: null,
  }
};

// Helper function to sort garment sizes in logical order
const sortGarmentSizes = (sizes) => {
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
    const aUpper = a.toUpperCase();
    const bUpper = b.toUpperCase();
    const aOrder = sizeOrder[aUpper];
    const bOrder = sizeOrder[bUpper];
    
    // If both sizes are in our predefined order, use that
    if (aOrder !== undefined && bOrder !== undefined) {
      return aOrder - bOrder;
    }
    
    // If one is defined and other isn't, prioritize the defined one
    if (aOrder !== undefined) return -1;
    if (bOrder !== undefined) return 1;
    
    // For unknown sizes, maintain their original order (stable sort)
    return 0;
  });
};

export default function CreateSizeChartDialog({ 
  open, 
  onClose, 
  initialData = {}, 
  isEdit, 
  sizeChartId = null, 
  onSuccess = () => '', 
  isSharedWithMe = false, 
  sharingpermissions = {} 
}) {
  const [selectedTable, setSelectedTable] = useState(TABLE_TYPES.MEASUREMENTS);
  const [tableData, setTableData] = useState({
    [TABLE_TYPES.MEASUREMENTS]: initialData.measurements || {},
    [TABLE_TYPES.GRADING_RULES]: initialData.grading_rules || {},
    [TABLE_TYPES.TOLERANCE]: initialData.tolerance || {},
    [TABLE_TYPES.SIZE_CONVERSION]: initialData.size_conversion || {},
  });
  
  const [newSizeChartName, setNewSizeChartName] = useState("");
  const [newRowName, setNewRowName] = useState("");
  const [newColumnName, setNewColumnName] = useState("");
  const [market, setMarket] = useState(initialData.market || "");
  const [unit, setUnit] = useState(initialData.unit || "");
  const [editingCell, setEditingCell] = useState(null);
  const cellRefs = useRef({});

  const isViewOnly = isSharedWithMe && sharingpermissions.edit !== true;
  const canEdit = !isViewOnly;

  useEffect(() => {
    if (open) {
      setTableData({
        [TABLE_TYPES.MEASUREMENTS]: initialData.measurements || {},
        [TABLE_TYPES.GRADING_RULES]: initialData.grading_rules || {},
        [TABLE_TYPES.TOLERANCE]: initialData.tolerance || {},
        [TABLE_TYPES.SIZE_CONVERSION]: initialData.size_conversion || {},
      });
      setMarket(initialData.market || "");
      setUnit(initialData.unit || "");
      setNewSizeChartName(initialData.name || "");
      setEditingCell(null);
      setNewRowName("");
      setNewColumnName("");
    }
  }, [open, initialData]);

  const currentTableData = tableData[selectedTable];
  const config = TABLE_CONFIG[selectedTable];
  
  // Improved column calculation with proper sorting
  const allColumns = React.useMemo(() => {
    if (selectedTable === TABLE_TYPES.TOLERANCE || selectedTable === TABLE_TYPES.GRADING_RULES) {
      return ["Value"];
    }

    // For dynamic tables, collect all unique columns
    const columns = new Set();
    Object.values(currentTableData).forEach(rowData => {
      if (typeof rowData === "object") {
        Object.keys(rowData).forEach(col => columns.add(col));
      }
    });
    
    // Sort the columns using garment size logic
    return sortGarmentSizes(Array.from(columns));
  }, [currentTableData, selectedTable]);

  const normalizedTableData = React.useMemo(() => {
    if (selectedTable === TABLE_TYPES.GRADING_RULES || selectedTable === TABLE_TYPES.TOLERANCE) {
      return Object.fromEntries(
        Object.entries(currentTableData).map(([row, val]) => [row, { Value: val }])
      );
    }
    return currentTableData;
  }, [currentTableData, selectedTable]);

  const addRow = () => {
  if (!canEdit) return;
  if (!newRowName.trim()) return;
  const key = newRowName.toLowerCase().replace(/\s+/g, "_");

  if (currentTableData[key]) {
    toast.error(`${config.rowLabel} already exists!`);
    return;
  }

  setTableData(prev => {
    const updatedTable = { ...prev[selectedTable] };

    if (selectedTable === TABLE_TYPES.GRADING_RULES || selectedTable === TABLE_TYPES.TOLERANCE) {
      // primitive tables → default value empty string
      updatedTable[key] = "";
    } else {
      // object tables → init columns
      updatedTable[key] = allColumns.reduce((acc, col) => ({ ...acc, [col]: "" }), {});
    }

    return { ...prev, [selectedTable]: updatedTable };
  });

  setNewRowName("");
};

  const addColumn = () => {
    if (!canEdit) return;
    if (!newColumnName.trim()) return;
    
    if (allColumns.includes(newColumnName)) {
      toast.error(`${config.columnLabel} already exists!`);
      return;
    }

    if (config.maxColumns && allColumns.length >= config.maxColumns) {
      toast.error(`Only ${config.maxColumns} ${config.columnLabel.toLowerCase()} allowed!`);
      return;
    }
    
    setTableData(prev => ({
      ...prev,
      [selectedTable]: Object.keys(prev[selectedTable]).reduce((acc, row) => {
        acc[row] = { ...prev[selectedTable][row], [newColumnName]: "" };
        return acc;
      }, {})
    }));
    setNewColumnName("");
  };

  const removeRow = (rowToRemove) => {
    if (!canEdit) return;
    setTableData(prev => {
      const updatedTable = { ...prev[selectedTable] };
      delete updatedTable[rowToRemove];
      return { ...prev, [selectedTable]: updatedTable };
    });
  };

  const removeColumn = (columnToRemove) => {
    if (!canEdit) return;
    setTableData(prev => {
      const updatedTable = { ...prev[selectedTable] };
      Object.keys(updatedTable).forEach((row) => {
        const updatedRow = { ...updatedTable[row] };
        delete updatedRow[columnToRemove];
        updatedTable[row] = updatedRow;
      });
      return { ...prev, [selectedTable]: updatedTable };
    });
  };

  const handleCellEdit = (row, column, value) => {
  if (!canEdit) return;
  setTableData(prev => {
    const updatedTable = { ...prev[selectedTable] };

    if (selectedTable === TABLE_TYPES.GRADING_RULES || selectedTable === TABLE_TYPES.TOLERANCE) {
      // Always store as string
      updatedTable[row] = value;
    } else {
      // Object-based tables
      updatedTable[row][column] = value;
    }

    return { ...prev, [selectedTable]: updatedTable };
  });
};


  const handleKeyDown = (e, row, column) => {
    if (!canEdit) return;
    const rows = Object.keys(currentTableData);
    const columns = allColumns;
    const currentRowIndex = rows.indexOf(row);
    const currentColumnIndex = columns.indexOf(column);

    let newRow = row;
    let newColumn = column;

    switch (e.key) {
      case 'Tab':
        e.preventDefault();
        if (e.shiftKey) {
          // Move left
          if (currentColumnIndex > 0) {
            newColumn = columns[currentColumnIndex - 1];
          } else if (currentRowIndex > 0) {
            newRow = rows[currentRowIndex - 1];
            newColumn = columns[columns.length - 1];
          }
        } else {
          // Move right
          if (currentColumnIndex < columns.length - 1) {
            newColumn = columns[currentColumnIndex + 1];
          } else if (currentRowIndex < rows.length - 1) {
            newRow = rows[currentRowIndex + 1];
            newColumn = columns[0];
          }
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (currentRowIndex > 0) {
          newRow = rows[currentRowIndex - 1];
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (currentRowIndex < rows.length - 1) {
          newRow = rows[currentRowIndex + 1];
        }
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (currentColumnIndex > 0) {
          newColumn = columns[currentColumnIndex - 1];
        }
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (currentColumnIndex < columns.length - 1) {
          newColumn = columns[currentColumnIndex + 1];
        }
        break;
      case 'Enter':
        e.preventDefault();
        if (currentRowIndex < rows.length - 1) {
          newRow = rows[currentRowIndex + 1];
        } else {
          // If at the last row, wrap around to the first row
          newRow = rows[0];
        }
        break;
      case 'Escape':
        setEditingCell(null);
        return;
      default:
        return;
    }

    if (newRow !== row || newColumn !== column) {
      setEditingCell({ row: newRow, column: newColumn });
      setTimeout(() => {
        const cellKey = `${newRow}-${newColumn}`;
        cellRefs.current[cellKey]?.focus();
      }, 0);
    }
  };

const handleSave = async () => {
  if (!canEdit) return;
  try {
    const payload = {
      name: newSizeChartName,
      measurements: tableData.measurements,
      grading_rules: tableData.grading_rules,
      tolerance: tableData.tolerance,
      size_conversion: tableData.size_conversion,
      market,
      unit,
    };

    let res;

    if (isEdit && sizeChartId) {
      // Update existing size chart
      res = await api.post("/image-variation/updateSizeChart", {
        ...payload,
        sizeChartId: sizeChartId,
      });
      if (res.status === 200) {
        toast.success("Size chart updated!");
      }
    } else {
      // Create new size chart
      res = await api.post("/image-variation/createSizeChartManually", payload);
      if (res.status === 201) {
        toast.success("Size chart created!");
      }
    }
   onSuccess();
    onClose();
  } catch (err) {
    console.error("Error saving size chart:", err);
    toast.error("Failed to save size chart");
  }
};

  // Determine dialog title
  const getDialogTitle = () => {
    if (!isEdit) return "Create New Size Chart";
    if (isSharedWithMe) {
      return sharingpermissions.edit === true ? "Shared Size Chart - Full Edit Access" : "Shared Size Chart - View Only";
    }
    return "Size Chart - Full View & Edit";
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isViewOnly && <Eye className="w-5 h-5" />}
            {getDialogTitle()}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto max-h-[60vh] pr-2 custom-scroll">
          {isViewOnly && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-2 rounded-md text-sm">
              You have view-only access to this shared size chart.
            </div>
          )}
          
          <Input 
            placeholder="Size Chart Name" 
            className="text-white bg-transparent" 
            value={newSizeChartName} 
            onChange={(e) => setNewSizeChartName(e.target.value)} 
            disabled={isViewOnly}
          />
          <div className="flex gap-2">
            <Input 
              placeholder="Market" 
              className="text-white" 
              value={market} 
              onChange={(e) => setMarket(e.target.value)} 
              disabled={isViewOnly}
            />
            <Input 
              placeholder="Unit" 
              className="text-white" 
              value={unit} 
              onChange={(e) => setUnit(e.target.value)} 
              disabled={isViewOnly}
            />
          </div>

          {/* Table Type Selector */}
          <div className="flex items-center gap-2">
            <Label className={"text-white"}>Table Type:</Label>
            <Select value={selectedTable} onValueChange={setSelectedTable} disabled={isViewOnly}>
              <SelectTrigger className="w-[200px] text-white">
                <SelectValue placeholder="Select table type" className="text-white" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TABLE_TYPES.MEASUREMENTS}>Measurements</SelectItem>
                <SelectItem value={TABLE_TYPES.GRADING_RULES}>Grading Rules</SelectItem>
                <SelectItem value={TABLE_TYPES.TOLERANCE}>Tolerance</SelectItem>
                <SelectItem value={TABLE_TYPES.SIZE_CONVERSION}>Size Conversion</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Add Row & Column Inputs - Only show if user can edit */}
          {canEdit && (
            <div className="grid grid-cols-2 gap-2">
              <div className="flex gap-2">
                <Input 
                  placeholder={config.rowPlaceholder}
                  value={newRowName} 
                  onChange={(e) => setNewRowName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addRow()}
                  className="text-white"
                />
                <Button onClick={addRow}><Plus /></Button>
              </div>
              {(!config.maxColumns || allColumns.length < config.maxColumns) && (
                <div className="flex gap-2">
                  <Input 
                    placeholder={config.columnPlaceholder}
                    value={newColumnName} 
                    onChange={(e) => setNewColumnName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addColumn()}
                    className="text-white"
                  />
                  <Button onClick={addColumn}><Plus /></Button>
                </div>
              )}
            </div>
          )}

          {/* Dynamic Table */}
          <div className="border border-solid border-zinc-200 rounded-lg">
            <Table>
              <TableCaption>
                {canEdit ? (
                  <p className="text-sm text-gray-500 mb-2">
                    Click any cell to edit • Use Tab/Arrow keys to navigate • Press Enter to move down • Press Escape to stop editing
                  </p>
                ) : (
                  <p className="text-sm text-gray-500 mb-2">
                    View-only mode {isSharedWithMe && "(Shared with you)"}
                  </p>
                )}
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px] sticky left-0 z-10 bg-zinc-900 rounded-tl-lg">
                    {config.rowLabel}
                  </TableHead>
                  {allColumns.map((col) => (
                    <TableHead key={col} className="text-center min-w-[100px]">
                      <div className="flex items-center justify-center gap-2">
                        <span>{col}</span>
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeColumn(col)}
                            className="p-1 h-auto text-red-500 hover:text-red-700"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </TableHead>
                  ))}
                  {canEdit && <TableHead className="text-center">Action</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
              {Object.entries(normalizedTableData).map(([row, columnVals]) => (
                <TableRow key={row}>
                  <TableCell className="font-medium capitalize sticky left-0 z-10 bg-zinc-900">
                    <div className="flex items-center justify-between">
                      <span>{row.replace(/_/g, " ")}</span>
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRow(row)}
                          className="p-1 h-auto text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </TableCell>

                  {allColumns.map((col) => {
                    const cellKey = `${row}-${col}`;
                    const isCurrentlyEditing = editingCell?.row === row && editingCell?.column === col;
                    const value = columnVals[col] ?? "";

                    return (
                      <TableCell key={col} className="text-center p-1">
                        {isViewOnly ? (
                          <div className="px-3 py-1 text-center border border-gray-200 rounded ">
                            {value || "-"}
                          </div>
                        ) : (
                          <Input
                            ref={(el) => (cellRefs.current[cellKey] = el)}
                            type="text"
                            value={value}
                            onChange={(e) => handleCellEdit(row, col, e.target.value)}
                            onFocus={() => setEditingCell({ row, column: col })}
                            onKeyDown={(e) => handleKeyDown(e, row, col)}
                            className={`text-center border border-solid ${
                              isCurrentlyEditing ? "border-blue-500" : "border-gray-300"
                            }`}
                            placeholder="-"
                            disabled={!canEdit}
                          />
                        )}
                      </TableCell>
                    );
                  })}
                  {canEdit && (
                    <TableCell className="text-center">
                      <Button variant="destructive" size="sm" onClick={() => removeRow(row)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={allColumns.length + (canEdit ? 2 : 1)} className="text-center">
                    <div className="flex justify-between items-center">
                      <span>Total {config.rowLabel}s: {Object.keys(currentTableData).length}</span>
                      <span>Total {config.columnLabel}s: {allColumns.length}</span>
                    </div>
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {isViewOnly ? "Close" : "Cancel"}
          </Button>
          {canEdit && (
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" /> Save
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}