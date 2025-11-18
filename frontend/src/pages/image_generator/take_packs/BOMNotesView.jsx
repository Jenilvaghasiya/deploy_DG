// components/BOM/BOMNotesView.jsx

import { Button } from "@/components/ui/button";
import { Plus, Trash2, FileText } from "lucide-react";
import BOMAutocompleteInput from "./BOMAutocompleteInput";
import ColorPickerWithPalette from "./ColorPickerWithPalette"; // ✅ CHANGE THIS

export default function BOMNotesView({ 
  items, 
  setItems, 
  inheritedWastageAllowance, 
  inheritedIncludeCost ,
    colorAnalysisData

  
}) {
  const addItem = () => {
    const newItem = {
      id: Date.now(),
      item: '',
      subItem: '',
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

  const removeItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id, field, value) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        
        // Recalculate total cost
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

  const fields = [
    { key: 'item', label: 'Item', type: 'autocomplete', fieldType: 'item' },
    { key: 'subItem', label: 'Sub-Item', type: 'autocomplete', fieldType: 'subItem' },
    { key: 'ref', label: 'Reference', type: 'text' },
    { key: 'material', label: 'Material', type: 'autocomplete', fieldType: 'material' },
    { key: 'quantity', label: 'Quantity', type: 'number' },
    { key: 'placement', label: 'Placement', type: 'text' },
    { key: 'color', label: 'Color', type: 'colorPalette' }, // ✅ CHANGE type
    { key: 'size', label: 'Size', type: 'text' },
    { key: 'unit', label: 'Unit', type: 'autocomplete', fieldType: 'unit' },
    { key: 'weight', label: 'Weight', type: 'text' },
  ];

  return (
    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scroll">
      {items.length === 0 ? (
        <div className="text-center py-12 text-gray-400 rounded-lg border-2 border-dashed border-zinc-700">
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <p className="mb-4 text-lg">No items added yet.</p>
          <Button
            onClick={addItem}
            variant={'outline'}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add First Item
          </Button>
        </div>
      ) : (
        <>
          {items.map((item, index) => (
            <div key={item.id} className=" rounded-lg p-5 space-y-4 border border-zinc-700 shadow-lg">
              {/* Header */}
              <div className="flex justify-between items-center pb-3 border-b border-zinc-600">
                <h4 className="text-lg font-semibold text-white">
                  Item #{index + 1}
                </h4>
                <Button
                  variant="destructive"
                  onClick={() => removeItem(item.id)}
                >
                  <Trash2 className="w-4 h-4" />
                  Remove
                </Button>
              </div>

              {/* Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fields.map((field) => (
                <div 
                    key={field.key}
                    className=""

                     /*className={`${
                    !item[field.key] && ['item', 'quantity'].includes(field.key) ? 'bg-red-500/20 p-3 rounded border-l-2 border-red-500' : ''
                    }`}*/
                >
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                    {field.label}
                    {/*['item', 'quantity'].includes(field.key) && <span className="text-red-400 ml-1">*</span>*/}
                    </label>
                    {field.type === 'colorPalette' ? (
                      <ColorPickerWithPalette
                        value={item[field.key] || ''}
                        onChange={(value) => updateItem(item.id, field.key, value)}
                        placeholder={field.label}
                        colorAnalysisData={colorAnalysisData}
                            prioritizeAnalysis={true}
                      />
                    )  : field.type === 'autocomplete' ? (
                    <BOMAutocompleteInput
                        fieldType={field.fieldType}
                        value={item[field.key] || ''}
                        onChange={(value) => updateItem(item.id, field.key, value)}
                        placeholder={field.label}
                    />
                    ) : field.type === 'number' ? (
                    <input
                        type="number"
                        value={item[field.key] || 0}
                        onChange={(e) => updateItem(item.id, field.key, parseFloat(e.target.value) || 0)}
                        className="w-full bg-zinc-700 border border-zinc-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                        min="0"
                    />
                    ) : field.type === 'palette' ? (
                    <ColorPaletteSelector
                        value={item[field.key] || ''}
                        onChange={(colorCode, colorName) => {
                        updateItem(item.id, field.key, {
                            code: colorCode,
                            name: colorName
                        });
                        }}
                        placeholder={field.label}
                    />
                    ) : (
                    <input
                        type="text"
                        value={item[field.key] || ''}
                        onChange={(e) => updateItem(item.id, field.key, e.target.value)}
                        className="w-full bg-zinc-700 border border-zinc-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                        placeholder={field.label}
                    />
                    )}
                </div>
                ))}
              </div>

              {/* Cost Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-zinc-600">
                <div>
                  <label className="flex items-center gap-2 mb-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={item.includeCost}
                      onChange={(e) => updateItem(item.id, 'includeCost', e.target.checked)}
                      className="w-4 h-4 accent-blue-500 cursor-pointer"
                    />
                    <span className="text-sm font-medium text-gray-300">Include Cost</span>
                  </label>

                  {item.includeCost && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Cost ($)</label>
                        <input
                          type="number"
                          value={item.cost || 0}
                          onChange={(e) => updateItem(item.id, 'cost', parseFloat(e.target.value) || 0)}
                          className="w-full bg-zinc-700 border border-zinc-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                          min="0"
                          step="0.01"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Wastage Allowance (%)</label>
                        <input
                          type="number"
                          value={item.wastageAllowance ?? inheritedWastageAllowance}
                          onChange={(e) => updateItem(item.id, 'wastageAllowance', parseFloat(e.target.value) || 0)}
                          className="w-full bg-zinc-700 border border-zinc-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                          min="0"
                          max="100"
                          step="0.1"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {item.includeCost && (
                  <div className="flex items-end">
                    <div className="w-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/40 rounded-lg p-4">
                      <div className="text-sm text-gray-300 mb-1">Total Cost</div>
                      <div className="text-2xl font-bold text-green-400">
                        ${(item.totalCost || 0).toFixed(2)}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Supplier Info */}
              <div className="pt-4 border-t border-zinc-600">
                <details className="group">
                  <summary className="cursor-pointer text-sm font-medium text-gray-300 hover:text-white transition-colors list-none flex items-center gap-2">
                    <span className="text-lg group-open:rotate-90 transition-transform">›</span>
                    Supplier Information (Optional)
                  </summary>
                  <div className="mt-3 space-y-3 pl-6">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Accredited Supplier</label>
                      <input
                        type="text"
                        value={item.accreditedSupplier || ''}
                        onChange={(e) => updateItem(item.id, 'accreditedSupplier', e.target.value)}
                        className="w-full bg-zinc-700 border border-zinc-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Contact Email</label>
                      <input
                        type="email"
                        value={item.contactEmail || ''}
                        onChange={(e) => updateItem(item.id, 'contactEmail', e.target.value)}
                        className="w-full bg-zinc-700 border border-zinc-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Contact Phone</label>
                      <input
                        type="tel"
                        value={item.contactPhone || ''}
                        onChange={(e) => updateItem(item.id, 'contactPhone', e.target.value)}
                        className="w-full bg-zinc-700 border border-zinc-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </details>
              </div>
            </div>
          ))}

          {/* Add Item Button */}
          <div className="flex justify-center">
          <Button
          variant={'dg_btn'}
            onClick={addItem}
            className="w-full bg-gradient-to-r text-white font-semibold py-3"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
          </div>
        </>
      )}
    </div>
  );
}