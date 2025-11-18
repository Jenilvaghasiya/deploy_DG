// components/BOM/ColorPickerWithPalette.jsx

import { useState, useRef, useEffect } from "react";
import { Palette, X } from "lucide-react";

// Base color definitions with their hue ranges
const BASE_COLORS = {
  red: { hue: 0, names: ['Crimson', 'Ruby', 'Cherry', 'Rose', 'Burgundy', 'Coral', 'Salmon', 'Brick', 'Terracotta', 'Vermillion'] },
  pink: { hue: 330, names: ['Rose', 'Blush', 'Fuchsia', 'Magenta', 'Hot Pink', 'Bubblegum', 'Carnation', 'Flamingo', 'Ballet', 'Orchid'] },
  orange: { hue: 30, names: ['Tangerine', 'Peach', 'Apricot', 'Coral', 'Rust', 'Amber', 'Copper', 'Bronze', 'Burnt Orange', 'Pumpkin'] },
  yellow: { hue: 60, names: ['Lemon', 'Gold', 'Canary', 'Mustard', 'Butter', 'Honey', 'Marigold', 'Sunflower', 'Champagne', 'Blonde'] },
  green: { hue: 120, names: ['Emerald', 'Mint', 'Lime', 'Olive', 'Forest', 'Sage', 'Jade', 'Pine', 'Moss', 'Seafoam'] },
  teal: { hue: 180, names: ['Turquoise', 'Aqua', 'Cyan', 'Ocean', 'Peacock', 'Teal', 'Lagoon', 'Robin Egg', 'Arctic', 'Marine'] },
  blue: { hue: 210, names: ['Sky', 'Navy', 'Royal', 'Cobalt', 'Sapphire', 'Azure', 'Indigo', 'Denim', 'Periwinkle', 'Steel'] },
  purple: { hue: 270, names: ['Violet', 'Lavender', 'Plum', 'Amethyst', 'Lilac', 'Mauve', 'Iris', 'Grape', 'Eggplant', 'Mulberry'] },
  brown: { hue: 30, names: ['Chocolate', 'Caramel', 'Coffee', 'Tan', 'Beige', 'Mocha', 'Chestnut', 'Walnut', 'Mahogany', 'Sienna'] },
  gray: { hue: 0, names: ['Charcoal', 'Slate', 'Silver', 'Ash', 'Smoke', 'Steel', 'Pewter', 'Graphite', 'Stone', 'Dove'] },
  white: { hue: 0, names: ['Ivory', 'Cream', 'Pearl', 'Snow', 'Alabaster', 'Linen', 'Vanilla', 'Eggshell', 'Porcelain', 'Coconut'] },
  black: { hue: 0, names: ['Jet', 'Ebony', 'Onyx', 'Raven', 'Coal', 'Midnight', 'Obsidian', 'Noir', 'Sable', 'Ink'] }
};

// Function to detect color from input text
const detectColorFamily = (colorInput) => {
  if (!colorInput) return null;
  const input = colorInput.toLowerCase().trim();
  
  // Check for exact matches or partial matches
  for (const [family, data] of Object.entries(BASE_COLORS)) {
    if (input.includes(family) || data.names.some(name => input.includes(name.toLowerCase()))) {
      return family;
    }
  }
  
  return null;
};

// Generate dynamic palette based on color family
const generateDynamicPalette = (colorFamily) => {
  if (!colorFamily || !BASE_COLORS[colorFamily]) {
    // Return default palette if no family detected
    return [
      { name: "Red", hex: "#FF0000" },
      { name: "Blue", hex: "#0000FF" },
      { name: "Green", hex: "#00FF00" },
      { name: "Yellow", hex: "#FFFF00" },
      { name: "Orange", hex: "#FFA500" },
      { name: "Purple", hex: "#800080" },
      { name: "Pink", hex: "#FFC0CB" },
      { name: "Brown", hex: "#A52A2A" },
      { name: "Black", hex: "#000000" },
      { name: "White", hex: "#FFFFFF" },
    ];
  }

  const baseHue = BASE_COLORS[colorFamily].hue;
  const names = BASE_COLORS[colorFamily].names;
  const palette = [];

  // Generate variations based on color family
  if (colorFamily === 'white' || colorFamily === 'gray' || colorFamily === 'black') {
    // For neutrals, generate lightness variations
    const baseLightness = colorFamily === 'white' ? 95 : colorFamily === 'black' ? 10 : 50;
    for (let i = 0; i < 10; i++) {
      const lightness = colorFamily === 'white' 
        ? 95 - (i * 8)
        : colorFamily === 'black'
        ? 10 + (i * 8)
        : 30 + (i * 7);
      palette.push({
        name: names[i] || `${colorFamily} ${i + 1}`,
        hex: hslToHex(0, 0, lightness)
      });
    }
  } else if (colorFamily === 'brown') {
    // Browns need special handling
    for (let i = 0; i < 10; i++) {
      const hue = 25 + (i * 5);
      const saturation = 30 + (i * 5);
      const lightness = 25 + (i * 5);
      palette.push({
        name: names[i] || `Brown ${i + 1}`,
        hex: hslToHex(hue, saturation, lightness)
      });
    }
  } else {
    // For chromatic colors, generate hue and saturation variations
    for (let i = 0; i < 10; i++) {
      const hueVariation = baseHue + (i * 6 - 30); // ±30 degree variation
      const saturation = 60 + (i % 3) * 15;
      const lightness = 45 + (i % 4) * 10;
      palette.push({
        name: names[i] || `${colorFamily} ${i + 1}`,
        hex: hslToHex(hueVariation, saturation, lightness)
      });
    }
  }

  return palette;
};

// Helper function to convert HSL to HEX
const hslToHex = (h, s, l) => {
  h = h % 360;
  s = Math.max(0, Math.min(100, s));
  l = Math.max(0, Math.min(100, l));
  
  const c = (1 - Math.abs(2 * l / 100 - 1)) * s / 100;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l / 100 - c / 2;
  
  let r, g, b;
  
  if (h < 60) {
    [r, g, b] = [c, x, 0];
  } else if (h < 120) {
    [r, g, b] = [x, c, 0];
  } else if (h < 180) {
    [r, g, b] = [0, c, x];
  } else if (h < 240) {
    [r, g, b] = [0, x, c];
  } else if (h < 300) {
    [r, g, b] = [x, 0, c];
  } else {
    [r, g, b] = [c, 0, x];
  }
  
  const toHex = (n) => {
    const hex = Math.round((n + m) * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
};

export default function ColorPickerWithPalette({ 
  value, 
  onChange, 
  placeholder, 
  compact = false,
  colorAnalysisData = null,
  prioritizeAnalysis = false
}) {  const [showPalette, setShowPalette] = useState(false);
  const [colorInput, setColorInput] = useState(value || "");
  const [dynamicPalette, setDynamicPalette] = useState([]);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);


  // Extract colors from analysis
const analysisColors = colorAnalysisData?.data?.dominant_colors?.map(c => ({
  name: c.fashion_match?.fashion_color_name || 'Unnamed',
  hex: c.hex,
  percentage: c.percentage
})) || [];

const hasAnalysisColors = analysisColors.length > 0;

console.log("ColorPickerWithPalette - hasAnalysisColors:", hasAnalysisColors, "count:", analysisColors.length);

  // Update palette when color input changes
  useEffect(() => {
    const colorFamily = detectColorFamily(colorInput);
    const newPalette = generateDynamicPalette(colorFamily);
    setDynamicPalette(newPalette);
  }, [colorInput]);

  useEffect(() => {
    setColorInput(value || "");
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setShowPalette(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectColor = (colorName) => {
    setColorInput(colorName);
    onChange(colorName);
    setShowPalette(false);
  };

  const handleManualInput = (e) => {
    const newValue = e.target.value;
    setColorInput(newValue);
    onChange(newValue);
  };

  const handleClearColor = () => {
    setColorInput("");
    onChange("");
  };

  const detectedFamily = detectColorFamily(colorInput);

  return (
    <div className="relative flex items-center gap-1">
      {/* Text Input */}
      <input
        type="text"
        value={colorInput}
        onChange={handleManualInput}
        placeholder={placeholder || "Enter color name"}
        className={`flex-1 bg-zinc-700 border border-zinc-600 rounded px-2 py-1 text-white text-sm focus:border-blue-500 focus:outline-none ${
          compact ? 'min-w-[80px]' : 'min-w-[120px]'
        }`}
      />

      {/* Clear Button - Hidden when compact */}
      {colorInput && !compact && (
        <button
          onClick={handleClearColor}
          className="p-1 hover:bg-zinc-600 rounded transition-colors flex-shrink-0"
          title="Clear color"
        >
          <X className="w-3 h-3 text-gray-400" />
        </button>
      )}

      {/* Palette Toggle Button */}
      <button
        ref={buttonRef}
        onClick={() => setShowPalette(!showPalette)}
        className="p-1 bg-zinc-700 border border-zinc-600 rounded hover:bg-zinc-600 transition-colors flex-shrink-0"
        title="Open color palette"
      >
        <Palette className={`${compact ? 'w-3 h-3' : 'w-4 h-4'} text-gray-400`} />
      </button>

      {/* Color Palette Dropdown */}
      {showPalette && (
  <div
    ref={dropdownRef}
    className="absolute z-50 top-full right-0 mt-1 bg-zinc-800 border border-zinc-600 rounded-lg shadow-xl p-3 w-[320px] max-h-[400px] overflow-y-auto"
  >
    {/* Color Analysis Section */}
    {hasAnalysisColors && prioritizeAnalysis && (
      <>
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-300 font-semibold">From Image Analysis</span>
            <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
              Detected
            </span>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {analysisColors.map((color, idx) => (
              <button
                key={`analysis-${idx}`}
                onClick={() => handleSelectColor(color.name)}
                className="group relative"
                title={`${color.name} (${color.percentage?.toFixed(1)}%)`}
              >
                <div
                  className="w-12 h-12 rounded border-2 border-zinc-600 hover:border-white transition-all hover:scale-110"
                  style={{ backgroundColor: color.hex }}
                />
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-zinc-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                  {color.name}
                  <br />
                  {color.percentage?.toFixed(1)}%
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="border-t border-zinc-600 my-3"></div>
      </>
    )}

    {/* Custom Colors */}
    <div className="text-xs text-gray-400 mb-2 font-semibold flex items-center justify-between">
      <span>Custom Colors</span>
      {detectedFamily && (
        <span className="text-blue-400 capitalize">
          {detectedFamily} shades
        </span>
      )}
    </div>
    <div className="grid grid-cols-5 gap-2 max-h-[200px] overflow-y-auto custom-scroll">
      {dynamicPalette.map((color, idx) => (
        <button
          key={idx}
          onClick={() => handleSelectColor(color.name)}
          className="group relative w-12 h-12 rounded border-2 border-zinc-600 hover:border-white transition-all hover:scale-110"
          style={{ backgroundColor: color.hex }}
          title={color.name}
        >
          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-zinc-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
            {color.name}
          </span>
        </button>
      ))}
    </div>

    {/* Analysis colors at bottom if not prioritized */}
    {hasAnalysisColors && !prioritizeAnalysis && (
      <>
        <div className="border-t border-zinc-600 my-3"></div>
        <div className="mb-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-300 font-semibold">From Image Analysis</span>
            <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
              Available
            </span>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {analysisColors.map((color, idx) => (
              <button
                key={`analysis-bottom-${idx}`}
                onClick={() => handleSelectColor(color.name)}
                className="group relative"
                title={`${color.name} (${color.percentage?.toFixed(1)}%)`}
              >
                <div
                  className="w-12 h-12 rounded border-2 border-zinc-600 hover:border-white transition-all hover:scale-110"
                  style={{ backgroundColor: color.hex }}
                />
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-zinc-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                  {color.name}
                  <br />
                  {color.percentage?.toFixed(1)}%
                </span>
              </button>
            ))}
          </div>
        </div>
      </>
    )}

    {!detectedFamily && !hasAnalysisColors && (
      <div className="text-xs text-gray-500 mt-2 text-center">
        Type a color name to see related shades
      </div>
    )}
  </div>
)}
    </div>
  );
}