import React, { useState } from 'react';
import { Palette, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ColorPicker, colorDatabase } from './ColorPicker';

// Export this component to use in ProductOverviewSection
export const ColorPickerField = ({ 
  value, 
  onChange, 
  isEditMode, 
  colorAnalysisData 
}) => {
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const handleColorSelect = (colorData) => {
    onChange(colorData);
  };

  const handleClearColor = () => {
    onChange({});
  };

  // Find the actual color hex value for preview
  const getColorHex = () => {
    if (!value.primary_color || !value.color_name) return null;
    const shade = colorDatabase[value.primary_color]?.shades.find(
      s => s.name === value.color_name
    );
    return shade?.color || null;
  };

  return (
    <>
      <Card className="backdrop-blur-md bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-xl text-white flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Colors
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Color Input Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-gray-300">Primary Color</label>
              <Input
                value={value.primary_color || ''}
                readOnly
                onClick={() => isEditMode && setIsPickerOpen(true)}
                className="bg-white/10 border-white/20 text-white cursor-pointer"
                placeholder="Select primary color"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-300">Color Name</label>
              <Input
                value={value.color_name || ''}
                readOnly
                className="bg-white/10 border-white/20 text-white"
                placeholder="Auto-filled"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-300">Pantone Code</label>
              <Input
                value={value.color_code || ''}
                readOnly
                className="bg-white/10 border-white/20 text-white"
                placeholder="Auto-filled"
              />
            </div>
          </div>

          {/* Visual Color Preview */}
          {value.primary_color && (
            <div className="flex items-center gap-3 p-4 bg-white/5 rounded-lg">
              <div 
                className="w-20 h-20 rounded-lg border-2 border-white/30 shadow-lg"
                style={{ 
                  backgroundColor: getColorHex() || '#808080'
                }}
              />
              <div className="flex-1">
                <p className="text-white font-semibold">{value.color_name}</p>
                <p className="text-gray-300 text-sm">{value.primary_color}</p>
                <p className="text-gray-400 text-xs">{value.color_code}</p>
              </div>
              {isEditMode && (
                <Button
                  onClick={handleClearColor}
                  variant="ghost"
                  size="sm"
                  className="text-red-400 hover:bg-red-500/20"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}

          {/* Color Picker Button */}
          {isEditMode && (
            <Button
              onClick={() => setIsPickerOpen(true)}
              variant="outline"
              className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <Palette className="w-4 h-4 mr-2" />
              {value.primary_color ? 'Change Color' : 'Select Color'}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Color Picker Dialog */}
      <ColorPicker
        open={isPickerOpen}
        onOpenChange={setIsPickerOpen}
        onColorSelect={handleColorSelect}
        colorAnalysisData={colorAnalysisData}
      />
    </>
  );
};