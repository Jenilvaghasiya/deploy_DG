// components/BOM/BOMTableView.jsx - NEW FILE

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Image as ImageIcon } from "lucide-react";
import BOMAutocompleteInput from "./BOMAutocompleteInput";
import ColorPickerWithPalette from "./ColorPickerWithPalette"; // ✅ CHANGE THIS
import { useUIStore } from "@/components/store/uiStore";

export default function BOMTableView({ 
  items, 
  setItems, 
  inheritedWastageAllowance, 
  inheritedIncludeCost,
  colorAnalysisData
}) {
  const [customColumns, setCustomColumns] = useState([]);
  const sidebarCollapsed = useUIStore(state => state.sidebarCollapsed);

  const defaultColumns = [
    { key: 'item', label: 'Item', type: 'autocomplete' },
    { key: 'ref', label: 'Ref', type: 'text' },
    { key: 'quantity', label: 'Quantity', type: 'number' },
    { key: 'material', label: 'Material', type: 'autocomplete' },
    { key: 'placement', label: 'Placement', type: 'text' },
    { key: 'color', label: 'Color', type: 'text' }, // CHANGE 'palette' back to 'text'
    { key: 'size', label: 'Size', type: 'text' },
    { key: 'unit', label: 'Unit', type: 'autocomplete' },
  ];

  const addRow = () => {
    const newItem = {
      id: Date.now(),
      item: '',
      ref: '',
      quantity: 0,
      material: '',
      placement: '',
      color: '',
      size: '',
      unit: '',
      weight: '',
      includeCost: inheritedIncludeCost,
      cost: 0,
      wastageAllowance: inheritedWastageAllowance,
      totalCost: 0,
      accreditedSupplier: '',
      contactEmail: '',
      contactPhone: '',
    };

    setItems([...items, newItem]);
  };

  const removeRow = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id, field, value) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        
        // Recalculate total cost if relevant fields change
        if (['cost', 'quantity', 'wastageAllowance', 'includeCost'].includes(field)) {
          if (updatedItem.includeCost && updatedItem.cost && updatedItem.quantity) {
            const wastage = updatedItem.wastageAllowance || 0;
            const costWithWastage = updatedItem.cost + (updatedItem.cost * (wastage / 100));
            updatedItem.totalCost = costWithWastage * updatedItem.quantity;
          } else {
            updatedItem.totalCost = 0;
          }
        }
        
        return updatedItem;
      }
      return item;
    }));
  };

  const addCustomColumn = () => {
    const columnName = prompt("Enter column name:");
    if (columnName) {
      setCustomColumns([...customColumns, { key: columnName.toLowerCase().replace(/\s+/g, '_'), label: columnName, type: 'text' }]);
    }
  };

  const allColumns = [...defaultColumns, ...customColumns];

  return (
  <div className="space-y-4">
    {/* Table Container */}
    <div className="border border-zinc-700 rounded-lg overflow-hidden bg-zinc-800/50">
      <div className="overflow-x-auto overflow-y-auto max-h-[450px]">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10 bg-zinc-800 shadow-md">
            <tr>
              {/* ✅ ADD min-width to column headers */}
                <th className={`px-2 py-3 text-left text-xs font-semibold text-gray-300 border-b-2 border-zinc-600 bg-zinc-800 whitespace-nowrap ${sidebarCollapsed ? 'min-w-[100px]' : 'min-w-[150px]'}`}>Item</th>
                <th className={`px-2 py-3 text-left text-xs font-semibold text-gray-300 border-b-2 border-zinc-600 bg-zinc-800 whitespace-nowrap ${sidebarCollapsed ? 'min-w-[60px]' : 'min-w-[100px]'}`}>Ref</th>
<th className={`px-2 py-3 text-left text-xs font-semibold text-gray-300 border-b-2 border-zinc-600 bg-zinc-800 whitespace-nowrap ${sidebarCollapsed ? 'min-w-[50px]' : 'min-w-[100px]'}`}>Quantity</th>
                <th className={`px-2 py-3 text-left text-xs font-semibold text-gray-300 border-b-2 border-zinc-600 bg-zinc-800 whitespace-nowrap ${sidebarCollapsed ? 'min-w-[100px]' : 'min-w-[150px]'}`}>Material</th>
                <th className={`px-2 py-3 text-left text-xs font-semibold text-gray-300 border-b-2 border-zinc-600 bg-zinc-800 whitespace-nowrap ${sidebarCollapsed ? 'min-w-[80px]' : 'min-w-[120px]'}`}>Placement</th>
<th className={`px-2 py-3 text-left text-xs font-semibold text-gray-300 border-b-2 border-zinc-600 bg-zinc-800 whitespace-nowrap ${sidebarCollapsed ? 'min-w-[100px]' : 'min-w-[180px]'}`}>Color</th>
                <th className={`px-2 py-3 text-left text-xs font-semibold text-gray-300 border-b-2 border-zinc-600 bg-zinc-800 whitespace-nowrap ${sidebarCollapsed ? 'min-w-[60px]' : 'min-w-[100px]'}`}>Size</th>
                <th className={`px-2 py-3 text-left text-xs font-semibold text-gray-300 border-b-2 border-zinc-600 bg-zinc-800 whitespace-nowrap ${sidebarCollapsed ? 'min-w-[60px]' : 'min-w-[100px]'}`}>Unit</th>
                <th className={`px-2 py-3 text-left text-xs font-semibold text-gray-300 border-b-2 border-zinc-600 bg-zinc-800 whitespace-nowrap ${sidebarCollapsed ? 'min-w-[70px]' : 'min-w-[100px]'}`}>Weight</th>
                <th className={`px-2 py-3 text-center text-xs font-semibold text-gray-300 border-b-2 border-zinc-600 bg-zinc-800 whitespace-nowrap ${sidebarCollapsed ? 'min-w-[60px]' : 'min-w-[80px]'}`}>Inc. Cost</th>
                <th className={`px-2 py-3 text-left text-xs font-semibold text-gray-300 border-b-2 border-zinc-600 bg-zinc-800 whitespace-nowrap ${sidebarCollapsed ? 'min-w-[70px]' : 'min-w-[100px]'}`}>Cost ($)</th>
                <th className={`px-2 py-3 text-left text-xs font-semibold text-gray-300 border-b-2 border-zinc-600 bg-zinc-800 whitespace-nowrap ${sidebarCollapsed ? 'min-w-[70px]' : 'min-w-[100px]'}`}>Wastage %</th>
                <th className={`px-2 py-3 text-left text-xs font-semibold text-gray-300 border-b-2 border-zinc-600 bg-zinc-800 whitespace-nowrap ${sidebarCollapsed ? 'min-w-[70px]' : 'min-w-[100px]'}`}>Total ($)</th>
                <th className={`px-2 py-3 text-center text-xs font-semibold text-gray-300 border-b-2 border-zinc-600 bg-zinc-800 whitespace-nowrap ${sidebarCollapsed ? 'min-w-[60px]' : 'min-w-[80px]'}`}>Actions</th> 
           </tr>
           </thead>
           <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={allColumns.length + 6} className="text-center py-12 text-gray-400">
                  No items added yet. Click "Add Row" below to start.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-b border-zinc-700 hover:bg-zinc-700/30 transition-colors">
                  {defaultColumns.map((col) => (
                    <td 
                        key={col.key} 
                        className={`px-3 py-3 ${
                        !item[col.key] && col.key === 'item' ? 'bg-red-500/20 border-l-2 border-red-500' : ''
                        }`}
                    >
                
                      {col.key === 'color' ? (
                        <div className={sidebarCollapsed ? 'max-w-[100px]' : ''}>
                         <ColorPickerWithPalette
                            value={item[col.key] || ''}
                            onChange={(value) => updateItem(item.id, col.key, value)}
                            placeholder={col.label}
                            compact={sidebarCollapsed}
                            colorAnalysisData={colorAnalysisData}
                            prioritizeAnalysis={true}
                          />
                        </div>  
                       )   :   
                        col.type === 'autocomplete' ? (
                        <BOMAutocompleteInput
                            fieldType={col.key}
                            value={item[col.key] || ''}
                            onChange={(value) => updateItem(item.id, col.key, value)}
                            placeholder={col.label}
                        />
                        ) : col.type === 'number' ? (
                        <input
                            type="number"
                            value={item[col.key] || 0}
                            onChange={(e) => updateItem(item.id, col.key, parseFloat(e.target.value) || 0)}
                            className={`w-full ${sidebarCollapsed ? 'min-w-[50px]' : 'min-w-[100px]'} bg-zinc-700 border border-zinc-600 rounded px-2 py-2 text-white text-sm focus:border-blue-500 focus:outline-none`}
                            min="0"
                        />
                        ) : col.type === 'palette' ? (
                        <ColorPaletteSelector
                            value={item[col.key] || ''}
                            onChange={(colorCode, colorName) => {
                            updateItem(item.id, col.key, {
                                code: colorCode,
                                name: colorName
                            });
                            }}
                            placeholder={col.label}
                        />
                        ) : (
                        <input
                            type="text"
                            value={item[col.key] || ''}
                            onChange={(e) => updateItem(item.id, col.key, e.target.value)}
                            className={`w-full ${sidebarCollapsed ? 'min-w-[60px]' : 'min-w-[120px]'} bg-zinc-700 border border-zinc-600 rounded px-2 py-2 text-white text-sm focus:border-blue-500 focus:outline-none`}                            placeholder={col.label}
                        />
                        )}
                    </td>
                    ))}
                  
                  {/* Weight */}
                  <td className="px-3 py-3">
                    <input
                      type="text"
                      value={item.weight || ''}
                      onChange={(e) => updateItem(item.id, 'weight', e.target.value)}
                      className={`w-full ${sidebarCollapsed ? 'min-w-[60px]' : 'min-w-[100px]'} bg-zinc-700 border border-zinc-600 rounded px-2 py-2 text-white text-sm focus:border-blue-500 focus:outline-none`}
                      placeholder="Weight"
                    />
                  </td>

                  {/* Include Cost Checkbox */}
                  <td className="px-3 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={item.includeCost}
                      onChange={(e) => updateItem(item.id, 'includeCost', e.target.checked)}
                      className="w-4 h-4 accent-blue-500 cursor-pointer"
                    />
                  </td>

                  {/* Cost */}
                  <td className="px-3 py-3">
                    <input
                      type="number"
                      value={item.cost || 0}
                      onChange={(e) => updateItem(item.id, 'cost', parseFloat(e.target.value) || 0)}
                      className={`w-full ${sidebarCollapsed ? 'min-w-[60px]' : 'min-w-[100px]'} bg-zinc-700 border border-zinc-600 rounded px-2 py-2 text-white text-sm focus:border-blue-500 focus:outline-none`}
                      min="0"
                      step="0.01"
                      disabled={!item.includeCost}
                    />
                  </td>

                  {/* Wastage Allowance */}
                  <td className="px-3 py-3">
                    <input
                      type="number"
                      value={item.wastageAllowance ?? inheritedWastageAllowance}
                      onChange={(e) => updateItem(item.id, 'wastageAllowance', parseFloat(e.target.value) || 0)}
                      className={`w-full ${sidebarCollapsed ? 'min-w-[60px]' : 'min-w-[100px]'} bg-zinc-700 border border-zinc-600 rounded px-2 py-2 text-white text-sm focus:border-blue-500 focus:outline-none`}
                      min="0"
                      max="100"
                      step="0.1"
                      disabled={!item.includeCost}
                    />
                  </td>

                  {/* Total Cost */}
                  <td className="px-3 py-3">
                    <div className="text-green-400 font-semibold text-sm whitespace-nowrap">
                      ${(item.totalCost || 0).toFixed(2)}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-3 py-3 text-center">
                    <button
                      onClick={() => removeRow(item.id)}
                      className="p-2 text-red-400 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>

    {/* Add Row Button */}
    <Button
      onClick={addRow}
      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3"
    >
      <Plus className="w-4 h-4 mr-2" />
      Add Row
    </Button>
  </div>
 );
}