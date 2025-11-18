import React, { useState } from 'react';
import { Palette, Check, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

// Comprehensive color database with shades and Pantone references
export const colorDatabase = {
  Red: {
    primary: 'Red',
    shades: [
      { name: 'Crimson', pantone: 'Similar to Pantone 1935 C', color: '#DC143C' },
      { name: 'Scarlet', pantone: 'Similar to Pantone 1788 C', color: '#FF2400' },
      { name: 'Ruby', pantone: 'Similar to Pantone 7621 C', color: '#E0115F' },
      { name: 'Wine', pantone: 'Similar to Pantone 7428 C', color: '#722F37' },
      { name: 'Burgundy', pantone: 'Similar to Pantone 1955 C', color: '#800020' },
      { name: 'Deep Maroon', pantone: 'Similar to Pantone 19-1617 TCX', color: '#8B0000' },
      { name: 'Cherry', pantone: 'Similar to Pantone 7621 C', color: '#DE3163' },
      { name: 'Brick Red', pantone: 'Similar to Pantone 7609 C', color: '#CB4154' }
    ]
  },
  Pink: {
    primary: 'Pink',
    shades: [
      { name: 'Hot Pink', pantone: 'Similar to Pantone 806 C', color: '#FF69B4' },
      { name: 'Rose Pink', pantone: 'Similar to Pantone 189 C', color: '#FF007F' },
      { name: 'Blush', pantone: 'Similar to Pantone 693 C', color: '#DE5D83' },
      { name: 'Muted Pink', pantone: 'Similar to Pantone 5025 C', color: '#D8A7B1' },
      { name: 'Dusty Rose', pantone: 'Similar to Pantone 5215 C', color: '#C9A9A6' },
      { name: 'Salmon Pink', pantone: 'Similar to Pantone 177 C', color: '#FF91A4' },
      { name: 'Magenta', pantone: 'Similar to Pantone 226 C', color: '#FF00FF' },
      { name: 'Fuchsia', pantone: 'Similar to Pantone 2395 C', color: '#FF00B4' }
    ]
  },
  Blue: {
    primary: 'Blue',
    shades: [
      { name: 'Navy Blue', pantone: 'Similar to Pantone 2768 C', color: '#000080' },
      { name: 'Royal Blue', pantone: 'Similar to Pantone 286 C', color: '#4169E1' },
      { name: 'Sky Blue', pantone: 'Similar to Pantone 2905 C', color: '#87CEEB' },
      { name: 'Cobalt Blue', pantone: 'Similar to Pantone 2728 C', color: '#0047AB' },
      { name: 'Teal Blue', pantone: 'Similar to Pantone 3155 C', color: '#008080' },
      { name: 'Powder Blue', pantone: 'Similar to Pantone 2707 C', color: '#B0E0E6' },
      { name: 'Midnight Blue', pantone: 'Similar to Pantone 19-4028 TCX', color: '#191970' },
      { name: 'Cerulean', pantone: 'Similar to Pantone 2985 C', color: '#007BA7' }
    ]
  },
  Green: {
    primary: 'Green',
    shades: [
      { name: 'Forest Green', pantone: 'Similar to Pantone 3425 C', color: '#228B22' },
      { name: 'Emerald', pantone: 'Similar to Pantone 3278 C', color: '#50C878' },
      { name: 'Olive Green', pantone: 'Similar to Pantone 5753 C', color: '#808000' },
      { name: 'Mint Green', pantone: 'Similar to Pantone 2240 C', color: '#98FF98' },
      { name: 'Sage Green', pantone: 'Similar to Pantone 5635 C', color: '#9CAF88' },
      { name: 'Lime Green', pantone: 'Similar to Pantone 375 C', color: '#32CD32' },
      { name: 'Hunter Green', pantone: 'Similar to Pantone 3500 C', color: '#355E3B' },
      { name: 'Sea Green', pantone: 'Similar to Pantone 3268 C', color: '#2E8B57' }
    ]
  },
  Yellow: {
    primary: 'Yellow',
    shades: [
      { name: 'Lemon Yellow', pantone: 'Similar to Pantone 101 C', color: '#FFF44F' },
      { name: 'Golden Yellow', pantone: 'Similar to Pantone 123 C', color: '#FFD700' },
      { name: 'Mustard', pantone: 'Similar to Pantone 7557 C', color: '#FFDB58' },
      { name: 'Canary Yellow', pantone: 'Similar to Pantone 109 C', color: '#FFEF00' },
      { name: 'Amber', pantone: 'Similar to Pantone 1375 C', color: '#FFBF00' },
      { name: 'Butter Yellow', pantone: 'Similar to Pantone 7403 C', color: '#FFFACD' },
      { name: 'Marigold', pantone: 'Similar to Pantone 7549 C', color: '#EAA221' },
      { name: 'Honey', pantone: 'Similar to Pantone 7569 C', color: '#FFC30B' }
    ]
  },
  Orange: {
    primary: 'Orange',
    shades: [
      { name: 'Tangerine', pantone: 'Similar to Pantone 165 C', color: '#F28500' },
      { name: 'Burnt Orange', pantone: 'Similar to Pantone 1595 C', color: '#CC5500' },
      { name: 'Coral', pantone: 'Similar to Pantone 16-1546 TCX', color: '#FF7F50' },
      { name: 'Peach', pantone: 'Similar to Pantone 169 C', color: '#FFE5B4' },
      { name: 'Apricot', pantone: 'Similar to Pantone 1565 C', color: '#FBCEB1' },
      { name: 'Pumpkin', pantone: 'Similar to Pantone 1585 C', color: '#FF7518' },
      { name: 'Rust', pantone: 'Similar to Pantone 7526 C', color: '#B7410E' },
      { name: 'Sunset Orange', pantone: 'Similar to Pantone 158 C', color: '#FD5E53' }
    ]
  },
  Purple: {
    primary: 'Purple',
    shades: [
      { name: 'Lavender', pantone: 'Similar to Pantone 2567 C', color: '#E6E6FA' },
      { name: 'Violet', pantone: 'Similar to Pantone 2665 C', color: '#8F00FF' },
      { name: 'Plum', pantone: 'Similar to Pantone 519 C', color: '#8E4585' },
      { name: 'Mauve', pantone: 'Similar to Pantone 5155 C', color: '#E0B0FF' },
      { name: 'Amethyst', pantone: 'Similar to Pantone 2587 C', color: '#9966CC' },
      { name: 'Royal Purple', pantone: 'Similar to Pantone 267 C', color: '#7851A9' },
      { name: 'Eggplant', pantone: 'Similar to Pantone 19-2524 TCX', color: '#614051' },
      { name: 'Orchid', pantone: 'Similar to Pantone 2573 C', color: '#DA70D6' }
    ]
  },
  Brown: {
    primary: 'Brown',
    shades: [
      { name: 'Chocolate', pantone: 'Similar to Pantone 476 C', color: '#7B3F00' },
      { name: 'Caramel', pantone: 'Similar to Pantone 729 C', color: '#C68E17' },
      { name: 'Tan', pantone: 'Similar to Pantone 4665 C', color: '#D2B48C' },
      { name: 'Beige', pantone: 'Similar to Pantone 7529 C', color: '#F5F5DC' },
      { name: 'Coffee', pantone: 'Similar to Pantone 7575 C', color: '#6F4E37' },
      { name: 'Khaki', pantone: 'Similar to Pantone 7502 C', color: '#C3B091' },
      { name: 'Mahogany', pantone: 'Similar to Pantone 483 C', color: '#C04000' },
      { name: 'Chestnut', pantone: 'Similar to Pantone 7554 C', color: '#954535' }
    ]
  },
  Gray: {
    primary: 'Gray',
    shades: [
      { name: 'Charcoal', pantone: 'Similar to Pantone 425 C', color: '#36454F' },
      { name: 'Slate Gray', pantone: 'Similar to Pantone 431 C', color: '#708090' },
      { name: 'Silver', pantone: 'Similar to Pantone 877 C', color: '#C0C0C0' },
      { name: 'Ash Gray', pantone: 'Similar to Pantone Cool Gray 9 C', color: '#B2BEB5' },
      { name: 'Dove Gray', pantone: 'Similar to Pantone 428 C', color: '#6D6E71' },
      { name: 'Steel Gray', pantone: 'Similar to Pantone 430 C', color: '#71797E' },
      { name: 'Smoke Gray', pantone: 'Similar to Pantone Cool Gray 7 C', color: '#738678' },
      { name: 'Pearl Gray', pantone: 'Similar to Pantone 427 C', color: '#E5E4E2' }
    ]
  },
  Black: {
    primary: 'Black',
    shades: [
      { name: 'Jet Black', pantone: 'Similar to Pantone Black C', color: '#000000' },
      { name: 'Onyx', pantone: 'Similar to Pantone Black 6 C', color: '#0F0F0F' },
      { name: 'Ebony', pantone: 'Similar to Pantone Black 7 C', color: '#0C0C0C' },
      { name: 'Obsidian', pantone: 'Similar to Pantone Black C', color: '#0B1215' },
      { name: 'Raven Black', pantone: 'Similar to Pantone Black 4 C', color: '#1C1C1C' },
      { name: 'Midnight Black', pantone: 'Similar to Pantone 19-0303 TCX', color: '#101010' },
      { name: 'Ink Black', pantone: 'Similar to Pantone Process Black C', color: '#000000' },
      { name: 'Carbon Black', pantone: 'Similar to Pantone Black 2 C', color: '#0A0A0A' }
    ]
  },
  White: {
    primary: 'White',
    shades: [
      { name: 'Pure White', pantone: 'Similar to Pantone 11-0601 TCX', color: '#FFFFFF' },
      { name: 'Ivory', pantone: 'Similar to Pantone 11-0602 TCX', color: '#FFFFF0' },
      { name: 'Cream', pantone: 'Similar to Pantone 11-0604 TCX', color: '#FFFDD0' },
      { name: 'Off-White', pantone: 'Similar to Pantone 11-4001 TCX', color: '#FAF9F6' },
      { name: 'Pearl White', pantone: 'Similar to Pantone 11-4301 TCX', color: '#F0EAD6' },
      { name: 'Snow White', pantone: 'Similar to Pantone 11-0601 TCX', color: '#FFFAFA' },
      { name: 'Bone White', pantone: 'Similar to Pantone 11-0701 TCX', color: '#F9F6EE' },
      { name: 'Antique White', pantone: 'Similar to Pantone 11-0105 TCX', color: '#FAEBD7' }
    ]
  }
};

export function ColorPicker({ 
  open, 
  onOpenChange, 
  onColorSelect, 
  colorAnalysisData 
}) {
  const [selectedPrimary, setSelectedPrimary] = useState(null);
  const analysisColors = colorAnalysisData?.data?.dominant_colors || [];
  const hasAnalysisColors = analysisColors.length > 0;

  const handlePrimarySelect = (primaryColor) => {
    setSelectedPrimary(primaryColor);
  };

  const handleShadeSelect = (shade) => {
    onColorSelect({
      primary_color: selectedPrimary,
      color_name: shade.name,
      color_code: shade.pantone
    });
    onOpenChange(false);
    setSelectedPrimary(null);
  };

  const handleAnalysisColorSelect = (color, idx) => {
    onColorSelect({
      primary_color: color.fashion_match?.fashion_color_name || `Color ${idx + 1}`,
      color_name: color.fashion_match?.fashion_color_name || `Color ${idx + 1}`,
      color_code: `Detected from image (${color.percentage?.toFixed(1)}% coverage)`
    });
    onOpenChange(false);
  };

  const handleBack = () => {
    setSelectedPrimary(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0 overflow-hidden">
        <DialogHeader className=" py-4">
          <DialogTitle className="flex items-center gap-3">
            {selectedPrimary && (
              <Button
                onClick={handleBack}
                size="sm"
                variant="ghost"
                className="hover:bg-accent"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
              </Button>
            )}
            <Palette className="w-5 h-5" />
            {selectedPrimary ? `${selectedPrimary} Shades` : 'Select Color'}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[60vh] px-6 pb-6 custom-scroll">
          {!selectedPrimary ? (
            <>
              {/* Analysis Colors Section */}
              {hasAnalysisColors && (
                <>
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Colors from Image Analysis</h3>
                      <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                        Auto-detected
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {analysisColors.map((color, idx) => (
                        <button
                          key={`analysis-${idx}`}
                          onClick={() => handleAnalysisColorSelect(color, idx)}
                          className="group relative flex items-center gap-4 p-4 rounded-lg border hover:border-green-500/70 transition-all hover:scale-[1.02] hover:shadow-lg bg-card"
                        >
                          <div
                            className="w-16 h-16 rounded-md flex-shrink-0 shadow-sm border"
                            style={{ backgroundColor: color.hex }}
                          />
                          <div className="flex-1 text-left">
                            <p className="font-semibold">
                              {color.fashion_match?.fashion_color_name || `Color ${idx + 1}`}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Coverage: {color.percentage?.toFixed(1)}%
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {color.fashion_match?.category?.replace(/_/g, ' ')}
                            </p>
                          </div>
                          <Check className="w-5 h-5 text-green-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        Or choose from palette
                      </span>
                    </div>
                  </div>
                </>
              )}

              {/* Primary Colors Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {Object.keys(colorDatabase).map((primaryColor) => (
                  <button
                    key={primaryColor}
                    onClick={() => handlePrimarySelect(primaryColor)}
                    className="group relative aspect-square rounded-lg overflow-hidden border-2 hover:border-primary transition-all hover:scale-105 hover:shadow-xl"
                  >
                    <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
                      {colorDatabase[primaryColor].shades.slice(0, 4).map((shade, idx) => (
                        <div
                          key={idx}
                          style={{ backgroundColor: shade.color }}
                          className="w-full h-full"
                        />
                      ))}
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end justify-center p-3">
                      <span className="text-white font-semibold text-sm drop-shadow-lg">
                        {primaryColor}
                      </span>
                    </div>
                    <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 cursor-pointer transition-all flex items-center justify-center">
                      <ChevronRight className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                ))}
              </div>
            </>
          ) : (
            /* Shades Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              {colorDatabase[selectedPrimary].shades.map((shade, idx) => (
                <button
                  key={idx}
                  onClick={() => handleShadeSelect(shade)}
                  className="group relative cursor-pointer flex items-center gap-4 p-4 rounded-lg border hover:border-primary transition-all hover:scale-[1.02] hover:shadow-lg bg-gray-300"
                >
                  <div
                    className="w-16 h-16 rounded-md flex-shrink-0 shadow-sm"
                    style={{ backgroundColor: shade.color }}
                  />
                  <div className="flex-1 text-left">
                    <p className="font-semibold">{shade.name}</p>
                    <p className="text-xs  mt-1">{shade.pantone}</p>
                  </div>
                  <Check className="w-5 h-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="p-4 border-t bg-muted/50">
          <p className="text-sm text-center">
            {selectedPrimary 
              ? 'Select a shade to auto-fill color details'
              : hasAnalysisColors 
                ? 'Choose from detected colors or browse the palette'
                : 'Select a primary color family to see available shades'
            }
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}