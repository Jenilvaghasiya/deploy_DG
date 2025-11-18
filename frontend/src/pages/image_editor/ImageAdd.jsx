import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { multipartRequest } from '../../api/axios.js';
import { Stage, Layer, Image as KonvaImage, Rect, Circle, Line, Transformer, Text as KonvaText, Arrow } from 'react-konva';
import Konva from 'konva';

import { 
  Mouse, Pencil, Square, Circle as CircleIcon, Type, Crop, 
  Eraser, ZoomIn, ZoomOut, Undo2, Redo2, Download, 
  Trash2, Eye, EyeOff, Copy, ArrowRight, ChevronDown, Image, Lock, Unlock
} from 'lucide-react';

const TOOLS = {
  SELECT: 'select',
  DRAW: 'draw',
  RECT: 'rect',
  CIRCLE: 'circle',
  ARROW: 'arrow',
  TEXT: 'text',
  CROP: 'crop',
  ERASER: 'eraser',
};

function useImage(url) {
  const [image, setImage] = useState(null);
  useEffect(() => {
    if (!url) { setImage(null); return; }
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => setImage(img);
    img.onerror = () => setImage(null);
    img.src = url;
    return () => setImage(null);
  }, [url]);
  return image;
}

const ToolButton = ({ active, onClick, title, icon: Icon, disabled }) => (
  <button
    type="button"
    title={title}
    onClick={onClick}
    disabled={disabled}
    className={`p-2.5 rounded-lg transition-all duration-200 ${
      active
        ? 'bg-gradient-to-r from-fuchsia-600 to-pink-500 text-white shadow'
        : 'bg-white/10 text-white hover:bg-white/20 border border-white/15 backdrop-blur'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
  >
    <Icon size={18} />
  </button>
);

const ImageEditor = () => {
  const navigate = useNavigate();
  const [imageUrl, setImageUrl] = useState('');
  const [originalImage, setOriginalImage] = useState(null);
  const image = useImage(imageUrl);

  const [tool, setTool] = useState(TOOLS.SELECT);
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [fillColor, setFillColor] = useState('#ffffff');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [fontSize, setFontSize] = useState(24);

  const [isDrawing, setIsDrawing] = useState(false);
  const [elements, setElements] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [cropRect, setCropRect] = useState(null);
  const [tempText, setTempText] = useState(null);

  const [stageScale, setStageScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  const stageRef = useRef(null);
  const layerRef = useRef(null);
  const transformerRef = useRef(null);
  const fileInputRef = useRef(null);

  const [history, setHistory] = useState([]);
  const [historyStep, setHistoryStep] = useState(-1);
  const [showLayers, setShowLayers] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveName, setSaveName] = useState('edited-image');
  const [saveFormat, setSaveFormat] = useState('png');
  // Export options
  const [exportQuality, setExportQuality] = useState(0.9); // 0..1
  const [exportWidth, setExportWidth] = useState(0);
  const [exportHeight, setExportHeight] = useState(0);
  const [lockAspect, setLockAspect] = useState(true);
  // Gallery picker modal state
  const [showGalleryPicker, setShowGalleryPicker] = useState(false);
  const [galleryImages, setGalleryImages] = useState([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [activeGalleryTab, setActiveGalleryTab] = useState('uploaded'); // uploaded | generated | saved | finalized
  const [formatOpen, setFormatOpen] = useState(false);

  const saveHistory = useCallback(() => {
    // Debounce or delay saving history slightly to batch rapid changes
    // (This is a simplified version; a true debounce might be better)
    setTimeout(() => {
      const newHistory = history.slice(0, historyStep + 1);
      newHistory.push({
        elements: JSON.parse(JSON.stringify(elements)),
        imageUrl,
        timestamp: Date.now(),
      });
      setHistory(newHistory);
      setHistoryStep(newHistory.length - 1);
    }, 0);
  }, [elements, history, historyStep, imageUrl]);

  const undo = () => {
    if (historyStep > 0) {
      const prevState = history[historyStep - 1];
      setElements(prevState.elements);
      setImageUrl(prevState.imageUrl);
      setHistoryStep(historyStep - 1);
      setSelectedId(null);
    }
  };

  // Fetch gallery images for picker
  const fetchGalleryForPicker = async (status = activeGalleryTab) => {
    try {
      setGalleryLoading(true);
      const response = await api.get('/gallery', { params: { status } });
      const BASE_API_URL = import.meta.env?.VITE_API_URL;
      const VITE_BASE_URL = import.meta.env?.VITE_BASE_URL;
      const images = (response.data?.data || []).map((img) => ({
        id: img.id,
        url:
          img.status === 'saved'
            ? `${BASE_API_URL}/genie-image/${img.url}`
            : img.url?.startsWith('http')
            ? img.url
            : `${VITE_BASE_URL}/${img.url}`,
        name: img.name,
        status: img.status || 'uploaded',
      }));
      setGalleryImages(images);
    } catch (err) {
      console.error('Failed to fetch gallery for picker:', err);
    } finally {
      setGalleryLoading(false);
    }
  };

  // Load selected gallery image into editor
  const loadFromGallery = async (image) => {
    try {
      const res = await fetch(image.url);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setImageUrl(url);
      setOriginalImage(url);
      setElements([]);
      setCropRect(null);
      setSelectedId(null);
      const initialState = { elements: [], imageUrl: url, timestamp: Date.now() };
      setHistory([initialState]);
      setHistoryStep(0);
      setShowGalleryPicker(false);
    } catch (err) {
      console.error('Error loading image from gallery:', err);
      alert('Could not load the selected image.');
    }
  };

  // When opening picker or changing tab, fetch images
  useEffect(() => {
    if (showGalleryPicker) {
      fetchGalleryForPicker(activeGalleryTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showGalleryPicker, activeGalleryTab]);

  const redo = () => {
    if (historyStep < history.length - 1) {
      const nextState = history[historyStep + 1];
      setElements(nextState.elements);
      setImageUrl(nextState.imageUrl);
      setHistoryStep(historyStep + 1);
      setSelectedId(null);
    }
  };

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        e.shiftKey ? redo() : undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      }
      if (e.key === 'Delete' && selectedId) {
        e.preventDefault();
        deleteSelected();
      }
      if (e.key === 'Escape') {
        setTool(TOOLS.SELECT);
        setSelectedId(null);
        setCropRect(null);
        setTempText(null); // Close text modal on escape
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [historyStep, selectedId]); // `undo` and `redo` are now stable, but `deleteSelected` depends on `selectedId`

  useEffect(() => {
    if (image) {
      const maxWidth = 1200;
      const maxHeight = 800;
      let width = image.width;
      let height = image.height;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      setCanvasSize({ width, height });
      setStagePos({ x: 0, y: 0 });
      setStageScale(1);
    }
  }, [image]);

  useEffect(() => {
    if (selectedId && transformerRef.current) {
      const node = layerRef.current?.findOne(`#${selectedId}`);
      if (node) {
        transformerRef.current.nodes([node]);
        transformerRef.current.getLayer().batchDraw();
      }
    } else if (transformerRef.current) {
      transformerRef.current.nodes([]);
    }
  }, [selectedId]);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setOriginalImage(url);
    setElements([]);
    setCropRect(null);
    setSelectedId(null);
    const initialState = { elements: [], imageUrl: url };
    setHistory([initialState]);
    setHistoryStep(0);
  };

  const handleWheel = (e) => {
    e.evt.preventDefault();
    const scaleBy = 1.1;
    const stage = stageRef.current;
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };
    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;
    const clampedScale = Math.max(0.1, Math.min(5, newScale));
    setStageScale(clampedScale);
    setStagePos({
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    });
  };

  const getRelativePointerPosition = (stage) => {
    const transform = stage.getAbsoluteTransform().copy();
    transform.invert();
    const pos = stage.getPointerPosition();
    return transform.point(pos);
  };

  const onMouseDown = (e) => {
    if (!image) return;
    
    // Deselect if clicking on stage or background image
    if (e.target === e.target.getStage() || e.target.attrs.id === 'background-image') {
      setSelectedId(null);
    }

    // Don't draw if select tool is active
    if (tool === TOOLS.SELECT) return;

    const stage = stageRef.current;
    const pos = getRelativePointerPosition(stage);

    if (tool === TOOLS.TEXT) {
      // NEW: Open modal to add text
      const id = `text-${Date.now()}`;
      setTempText({ id, x: pos.x, y: pos.y, text: '', fontSize, fill: strokeColor });
      return;
    }

    if (tool === TOOLS.CROP) {
      setCropRect({ x: pos.x, y: pos.y, width: 0, height: 0 });
      setIsDrawing(true);
      return;
    }

    setIsDrawing(true);
    const id = `${tool}-${Date.now()}`;

    if (tool === TOOLS.DRAW) {
      setElements([...elements, {
        id, type: 'line', points: [pos.x, pos.y],
        stroke: strokeColor, strokeWidth, visible: true
      }]);
    } else if (tool === TOOLS.ERASER) {
      setElements([...elements, {
        id, type: 'eraser', points: [pos.x, pos.y],
        stroke: '#ffffff', strokeWidth: strokeWidth * 3, visible: true,
        globalCompositeOperation: 'destination-out'
      }]);
    } else if (tool === TOOLS.RECT) {
      setElements([...elements, {
        id, type: 'rect', x: pos.x, y: pos.y, width: 0, height: 0,
        stroke: strokeColor, strokeWidth, fill: fillColor + '40', visible: true
      }]);
    } else if (tool === TOOLS.CIRCLE) {
      setElements([...elements, {
        id, type: 'circle', x: pos.x, y: pos.y, radius: 0,
        stroke: strokeColor, strokeWidth, fill: fillColor + '40', visible: true
      }]);
    } else if (tool === TOOLS.ARROW) {
      setElements([...elements, {
        id, type: 'arrow', points: [pos.x, pos.y, pos.x, pos.y],
        stroke: strokeColor, strokeWidth, fill: strokeColor, visible: true
      }]);
    }
  };

  const onMouseMove = (e) => {
    if (!isDrawing) return;
    const stage = stageRef.current;
    const pos = getRelativePointerPosition(stage);

    if (tool === TOOLS.CROP && cropRect) {
      setCropRect({ ...cropRect, width: pos.x - cropRect.x, height: pos.y - cropRect.y });
      return;
    }

    setElements((prev) => {
      const copy = [...prev];
      const last = copy[copy.length - 1];

      if (tool === TOOLS.DRAW || tool === TOOLS.ERASER) {
        last.points = last.points.concat([pos.x, pos.y]);
      } else if (tool === TOOLS.RECT) {
        last.width = pos.x - last.x;
        last.height = pos.y - last.y;
      } else if (tool === TOOLS.CIRCLE) {
        const dx = pos.x - last.x;
        const dy = pos.y - last.y;
        last.radius = Math.sqrt(dx * dx + dy * dy);
      } else if (tool === TOOLS.ARROW) {
        last.points = [last.points[0], last.points[1], pos.x, pos.y];
      }

      return copy;
    });
  };

  const onMouseUp = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveHistory();
    }
  };

  // NEW: Handle text submission (for both new and edited text)
  const handleTextSubmit = () => {
    if (!tempText || !tempText.text.trim()) {
      setTempText(null);
      setTool(TOOLS.SELECT);
      return;
    }

    const existingElementIndex = elements.findIndex(el => el.id === tempText.id);

    if (existingElementIndex !== -1) {
      // It's an edit
      const newElements = [...elements];
      newElements[existingElementIndex] = {
        ...newElements[existingElementIndex],
        ...tempText,
        type: 'text', // ensure type is set
        visible: true, // ensure it's visible
      };
      setElements(newElements);
    } else {
      // It's new
      setElements([...elements, { ...tempText, type: 'text', visible: true }]);
    }

    saveHistory();
    setTempText(null);
    setTool(TOOLS.SELECT);
  };

  const applyCrop = () => {
    if (!image || !cropRect) return;
    const { x, y, width, height } = cropRect;
    if (Math.abs(width) < 10 || Math.abs(height) < 10) {
      setCropRect(null);
      return;
    }

    const stage = stageRef.current;
    const layer = layerRef.current;
    
    // Create temporary stage for cropping
    const tempStage = new Konva.Stage({
      container: document.createElement('div'),
      width: canvasSize.width,
      height: canvasSize.height,
    });
    
    const tempLayer = layer.clone();
    tempStage.add(tempLayer);

    const rx = Math.min(x, x + width);
    const ry = Math.min(y, y + height);
    const rw = Math.abs(width);
    const rh = Math.abs(height);

    const dataURL = tempStage.toDataURL({
      x: rx,
      y: ry,
      width: rw,
      height: rh,
      pixelRatio: 2,
    });

    tempStage.destroy();

    setImageUrl(dataURL);
    setCanvasSize({ width: rw, height: rh });
    setElements([]);
    setCropRect(null);
    setStageScale(1);
    setStagePos({ x: 0, y: 0 });
    
    // Update history after crop
    const newState = { elements: [], imageUrl: dataURL };
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(newState);
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

  const saveImage = () => {
    if (!stageRef.current) return;
    const uri = stageRef.current.toDataURL({ pixelRatio: 2 });
    const link = document.createElement('a');
    link.download = 'edited-image.png';
    link.href = uri;
    link.click();
  };

  const openSaveModal = () => {
    setSaveName('edited-image');
    setSaveFormat('png');
    setExportQuality(0.9);
    setExportWidth(canvasSize.width);
    setExportHeight(canvasSize.height);
    setLockAspect(true);
    setShowSaveModal(true);
  };

  const saveToGallery = async () => {
    if (!stageRef.current || saving) return;
    try {
      setSaving(true);
      const mime =
        saveFormat === 'jpg' || saveFormat === 'jpeg'
          ? 'image/jpeg'
          : saveFormat === 'webp'
          ? 'image/webp'
          : 'image/png';
      const pixelRatio = exportWidth && canvasSize.width ? Math.max(0.1, Math.min(8, exportWidth / canvasSize.width)) : 2;
      const opts = { pixelRatio, mimeType: mime };
      if (mime === 'image/jpeg' || mime === 'image/webp') {
        opts.quality = Math.max(0.1, Math.min(1, exportQuality));
      }
      const dataUrl = stageRef.current.toDataURL(opts);
      const ext = saveFormat === 'jpeg' ? 'jpeg' : saveFormat === 'webp' ? 'webp' : saveFormat === 'jpg' ? 'jpg' : 'png';
      const fileName = `${saveName || 'edited-image'}.${ext}`;
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], fileName, { type: mime });
      const form = new FormData();
      form.append('images', file);
      await multipartRequest.post('/gallery', form);
      setShowSaveModal(false);
      navigate('/gallery');
    } catch (err) {
      console.error('Save to gallery failed:', err);
      alert('Failed to save to gallery.');
    } finally {
      setSaving(false);
    }
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    setElements(elements.filter(el => el.id !== selectedId));
    setSelectedId(null);
    saveHistory();
  };

  const toggleVisibility = (id) => {
    setElements(elements.map(el => 
      el.id === id ? { ...el, visible: !el.visible } : el
    ));
    // Note: This change does not save to history, it's just a view toggle.
    // If you want it in history, call saveHistory().
  };

  const duplicateElement = (id) => {
    const element = elements.find(el => el.id === id);
    if (!element) return;
    const newElement = {
      ...element,
      id: `${element.type}-${Date.now()}`,
      x: element.x ? element.x + 20 : undefined,
      y: element.y ? element.y + 20 : undefined,
    };
    setElements([...elements, newElement]);
    saveHistory();
  };

  const clearCanvas = () => {
    if (window.confirm('Clear all annotations? The original image will remain.')) {
      setElements([]);
      saveHistory();
    }
  };

  const resetImage = () => {
    if (window.confirm('Reset to original image?')) {
      setImageUrl(originalImage);
      setElements([]);
      setCropRect(null);
      setSelectedId(null);
      
      const newState = { elements: [], imageUrl: originalImage };
      const newHistory = history.slice(0, historyStep + 1);
      newHistory.push(newState);
      setHistory(newHistory);
      setHistoryStep(newHistory.length - 1);
    }
  };

  const renderElement = (element) => {
    const isSelected = element.id === selectedId;
    const commonProps = {
      id: element.id,
      onClick: () => tool === TOOLS.SELECT && setSelectedId(element.id),
      onTap: () => tool === TOOLS.SELECT && setSelectedId(element.id),
      draggable: tool === TOOLS.SELECT,
      visible: element.visible !== false,
    };

    if (element.type === 'line') {
      return (
        <Line
          key={element.id}
          {...commonProps}
          points={element.points}
          stroke={element.stroke}
          strokeWidth={element.strokeWidth}
          lineCap="round"
          lineJoin="round"
          tension={0.5}
        />
      );
    }

    if (element.type === 'eraser') {
      return (
        <Line
          key={element.id}
          {...commonProps}
          points={element.points}
          stroke={element.stroke}
          strokeWidth={element.strokeWidth}
          lineCap="round"
          lineJoin="round"
          globalCompositeOperation="destination-out"
        />
      );
    }

    if (element.type === 'rect') {
      return (
        <Rect
          key={element.id}
          {...commonProps}
          x={Math.min(element.x, element.x + element.width)}
          y={Math.min(element.y, element.y + element.height)}
          width={Math.abs(element.width)}
          height={Math.abs(element.height)}
          stroke={element.stroke}
          strokeWidth={element.strokeWidth}
          fill={element.fill}
        />
      );
    }

    if (element.type === 'circle') {
      return (
        <Circle
          key={element.id}
          {...commonProps}
          x={element.x}
          y={element.y}
          radius={Math.abs(element.radius)}
          stroke={element.stroke}
          strokeWidth={element.strokeWidth}
          fill={element.fill}
        />
      );
    }

    if (element.type === 'arrow') {
      return (
        <Arrow
          key={element.id}
          {...commonProps}
          points={element.points}
          stroke={element.stroke}
          strokeWidth={element.strokeWidth}
          fill={element.fill}
          pointerLength={10}
          pointerWidth={10}
        />
      );
    }

    if (element.type === 'text') {
      return (
        <KonvaText
          key={element.id}
          {...commonProps}
          x={element.x}
          y={element.y}
          text={element.text}
          fontSize={element.fontSize}
          fill={element.fill}
          // NEW: Add double-click handler to edit text
          onDblClick={() => {
            if (tool === TOOLS.SELECT) {
              setTempText(element); // Re-open the modal with this element's data
            }
          }}
          onDblTap={() => {
            if (tool === TOOLS.SELECT) {
              setTempText(element);
            }
          }}
        />
      );
    }

    return null;
  };

  // Check if we are editing existing text
  const isEditingText = tempText?.type === 'text';

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-transparent text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between bg-aside border-b border-white/10 px-6 py-3 backdrop-blur rounded-t-xl">
        <div className="flex items-center gap-3">
          <Image className="text-pink-500" size={24} />
          <h1 className="text-xl font-bold text-white">Image Editor</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 rounded-full font-medium bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-colors"
          >
            Upload From Device
          </button>
          <button
            onClick={() => setShowGalleryPicker(true)}
            className="px-4 py-2 rounded-full font-medium bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-colors"
          >
            Upload from My Gallery
          </button>

          {image && (
            <>
              <div className="w-px h-6 bg-white/20 mx-2" />
              <button
                onClick={undo}
                disabled={historyStep <= 0}
                className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Undo (Ctrl+Z)"
              >
                <Undo2 size={20} />
              </button>
              <button
                onClick={redo}
                disabled={historyStep >= history.length - 1}
                className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Redo (Ctrl+Y)"
              >
                <Redo2 size={20} />
              </button>
              <div className="w-px h-6 bg-white/20 mx-2" />
              <button
                onClick={saveImage}
                className="px-4 py-2 rounded-full font-medium bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-colors flex items-center gap-2"
              >
                <Download size={18} />
                Download
              </button>
              <button
                onClick={openSaveModal}
                className="px-4 py-2 rounded-full font-medium text-white transition-all bg-gradient-to-r from-fuchsia-600 via-purple-600 to-blue-500 hover:from-fuchsia-500 hover:via-purple-500 hover:to-blue-400 active:scale-95 shadow"
              >
                Save to Gallery
              </button>
            </>
          )}
        </div>
      </div>

      {/* Toolbar */}
      {image && (
        <div className="bg-white/5 border-b border-white/10 px-6 py-3 backdrop-blur">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-white/10 p-1 rounded-lg border border-white/10 backdrop-blur">
                <ToolButton icon={Mouse} title="Select (V)" active={tool === TOOLS.SELECT} onClick={() => setTool(TOOLS.SELECT)} />
                <ToolButton icon={Pencil} title="Draw (D)" active={tool === TOOLS.DRAW} onClick={() => setTool(TOOLS.DRAW)} />
                <ToolButton icon={Square} title="Rectangle (R)" active={tool === TOOLS.RECT} onClick={() => setTool(TOOLS.RECT)} />
                <ToolButton icon={CircleIcon} title="Circle (C)" active={tool === TOOLS.CIRCLE} onClick={() => setTool(TOOLS.CIRCLE)} />
                <ToolButton icon={ArrowRight} title="Arrow (A)" active={tool === TOOLS.ARROW} onClick={() => setTool(TOOLS.ARROW)} />
                <ToolButton icon={Type} title="Text (T)" active={tool === TOOLS.TEXT} onClick={() => setTool(TOOLS.TEXT)} />
                <ToolButton icon={Eraser} title="Eraser (E)" active={tool === TOOLS.ERASER} onClick={() => setTool(TOOLS.ERASER)} />
                <ToolButton icon={Crop} title="Crop" active={tool === TOOLS.CROP} onClick={() => setTool(TOOLS.CROP)} />
              </div>

              <div className="w-px h-8 bg-white/20 mx-2" />

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-zinc-300">Stroke:</label>
                  <input
                    type="color"
                    value={strokeColor}
                    onChange={(e) => setStrokeColor(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer border border-white/20 bg-white/10"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-zinc-300">Fill:</label>
                  <input
                    type="color"
                    value={fillColor}
                    onChange={(e) => setFillColor(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer border border-white/20 bg-white/10"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-zinc-300">Width:</label>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={strokeWidth}
                    onChange={(e) => setStrokeWidth(Number(e.target.value))}
                    className="w-24"
                  />
                  <span className="text-sm text-zinc-400 w-6">{strokeWidth}</span>
                </div>

                {tool === TOOLS.TEXT && (
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-zinc-300">Size:</label>
                    <input
                      type="range"
                      min="12"
                      max="72"
                      value={fontSize}
                      onChange={(e) => setFontSize(Number(e.target.value))}
                      className="w-24"
                    />
                    <span className="text-sm text-zinc-400 w-8">{fontSize}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setStageScale(Math.min(5, stageScale * 1.2))}
                className="p-2 rounded-lg hover:bg-white/10"
                title="Zoom In"
              >
                <ZoomIn size={20} />
              </button>
              <span className="text-sm font-medium text-zinc-300 w-12 text-center">
                {Math.round(stageScale * 100)}%
              </span>
              <button
                onClick={() => setStageScale(Math.max(0.1, stageScale / 1.2))}
                className="p-2 rounded-lg hover:bg-white/10"
                title="Zoom Out"
              >
                <ZoomOut size={20} />
              </button>

              <div className="w-px h-6 bg-white/20 mx-2" />

              <button
                onClick={clearCanvas}
                className="p-2 rounded-lg hover:bg-white/10 text-red-400"
                title="Clear Annotations"
              >
                <Trash2 size={20} />
              </button>

              <button
                onClick={() => setShowLayers(!showLayers)}
                className="p-2 rounded-lg hover:bg-white/10"
                title="Toggle Layers"
              >
                <ChevronDown size={20} className={showLayers ? 'rotate-180 transition-transform' : 'transition-transform'} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Canvas Area */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex items-center justify-center bg-transparent p-6">
          {!image ? (
            <div
              className="relative border-shadow-blur bg-white/5 border border-white/10 rounded-[22px] shadow overflow-hidden backdrop-blur-xl w-[min(90vw,1100px)] h-[min(60vh,520px)] flex items-center justify-center"
            >
              <div className="absolute inset-2 rounded-2xl border-2 border-white/30 border-dashed pointer-events-none" />
              <div className="text-center relative z-10">
                <div className="w-24 h-24 mx-auto mb-4 bg-white/10 border border-white/15 rounded-full flex items-center justify-center backdrop-blur">
                  <Image size={48} className="text-zinc-400" />
                </div>
                <h2 className="text-2xl font-semibold text-white mb-2">No Image Loaded</h2>
                <p className="text-zinc-300/70 mb-6">Upload an image to start editing</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-fuchsia-600 via-purple-600 to-blue-500 hover:from-fuchsia-500 hover:via-purple-500 hover:to-blue-400 active:scale-95 shadow"
                >
                  Choose Image
                </button>
              </div>
            </div>
          ) : (
            <div className="relative border-shadow-blur bg-white/5 border border-white/10 rounded-[22px] shadow overflow-hidden backdrop-blur-lg" style={{ 
              width: canvasSize.width * stageScale + 40,
              height: canvasSize.height * stageScale + 40,
            }}>
              <div className="absolute inset-2 rounded-2xl border-2 border-white/30 border-dashed pointer-events-none" />
              <Stage
                ref={stageRef}
                width={canvasSize.width}
                height={canvasSize.height}
                scaleX={stageScale}
                scaleY={stageScale}
                x={stagePos.x}
                y={stagePos.y}
                onWheel={handleWheel}
                onMouseDown={onMouseDown}
                onMousemove={onMouseMove}
                onMouseup={onMouseUp}
                onTouchStart={onMouseDown}
                onTouchMove={onMouseMove}
                onTouchEnd={onMouseUp}
                className="m-5"
              >
                <Layer ref={layerRef}>
                  <KonvaImage
                    id="background-image"
                    image={image}
                    width={canvasSize.width}
                    height={canvasSize.height}
                  />
                  
                  {elements.map(renderElement)}

                  {tool === TOOLS.CROP && cropRect && (
                    <>
                      <Rect
                        x={0}
                        y={0}
                        width={canvasSize.width}
                        height={canvasSize.height}
                        fill="black"
                        opacity={0.5}
                      />
                      <Rect
                        x={Math.min(cropRect.x, cropRect.x + cropRect.width)}
                        y={Math.min(cropRect.y, cropRect.y + cropRect.height)}
                        width={Math.abs(cropRect.width)}
                        height={Math.abs(cropRect.height)}
                        fill="transparent"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dash={[10, 5]}
                      />
                    </>
                  )}

                  {tool === TOOLS.SELECT && <Transformer ref={transformerRef} />}
                </Layer>
              </Stage>
            </div>
          )}
        </div>

        {/* Layers Panel */}
        {showLayers && image && (
          <div className="w-64 bg-white/5 border-l border-white/10 overflow-y-auto backdrop-blur">
            <div className="p-4">
              <h3 className="font-semibold text-white mb-3">Layers ({elements.length})</h3>
              <div className="space-y-2">
                {elements.map((element, index) => (
                  <div
                    key={element.id}
                    className={`p-2 rounded border cursor-pointer hover:bg-white/10 ${
                      selectedId === element.id ? 'border-fuchsia-500 bg-fuchsia-500/10' : 'border-white/10'
                    }`}
                    onClick={() => setSelectedId(element.id)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-zinc-300">
                        {element.type} {elements.length - index}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleVisibility(element.id); }}
                          className="p-1 hover:bg-white/10 rounded"
                        >
                          {element.visible !== false ? <Eye size={14} /> : <EyeOff size={14} />}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); duplicateElement(element.id); }}
                          className="p-1 hover:bg-white/10 rounded"
                        >
                          <Copy size={14} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteSelected(); }}
                          className="p-1 hover:bg-red-900/20 rounded text-red-400"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Crop Action Bar */}
      {tool === TOOLS.CROP && cropRect && Math.abs(cropRect.width) > 10 && Math.abs(cropRect.height) > 10 && (
        <div className="bg-white/5 border-t border-white/10 px-6 py-3 flex items-center justify-between shadow-lg backdrop-blur">
          <div className="text-sm text-zinc-400">
            Size: {Math.abs(Math.round(cropRect.width))} × {Math.abs(Math.round(cropRect.height))} px
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setCropRect(null); setTool(TOOLS.SELECT); }}
              className="px-5 py-2 bg-white/10 text-zinc-200 rounded-full hover:bg-white/20 transition-colors font-medium border border-white/15"
            >
              Cancel
            </button>
            <button
              onClick={applyCrop}
              className="px-5 py-2 rounded-full font-semibold text-white bg-gradient-to-r from-fuchsia-600 via-purple-600 to-blue-500 hover:from-fuchsia-500 hover:via-purple-500 hover:to-blue-400 active:scale-95 shadow"
            >
              Apply Crop
            </button>
          </div>
        </div>
      )}

      {/* Save to Gallery Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white/10 border border-white/10 rounded-xl p-6 w-[420px] shadow-xl backdrop-blur-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Save to Gallery</h3>
              <button onClick={() => setShowSaveModal(false)} className="p-1 rounded hover:bg-white/10">✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-300 mb-1">Name</label>
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  className="w-full border border-white/15 bg-white/10 text-white rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50"
                  placeholder="edited-image"
                />
              </div>

              <div className="relative">
                <label className="block text-sm text-zinc-300 mb-1">Format</label>
                <button
                  type="button"
                  onClick={() => setFormatOpen((o) => !o)}
                  className="w-full text-left border border-fuchsia-500/60 bg-white/10/50 backdrop-blur rounded-lg px-3 py-2.5 text-white hover:bg-white/20 transition-colors"
                >
                  {saveFormat.toUpperCase()}
                </button>
                {formatOpen && (
                  <div className="absolute z-10 mt-2 w-full rounded-lg border border-white/15 bg-black/40 backdrop-blur-xl shadow-xl overflow-hidden">
                    {['png','jpg','jpeg','webp'].map((fmt) => (
                      <button
                        key={fmt}
                        type="button"
                        onClick={() => { setSaveFormat(fmt); setFormatOpen(false); }}
                        className={`w-full text-left px-3 py-2 text-sm ${saveFormat===fmt ? 'bg-white/15 text-white' : 'text-zinc-200 hover:bg-white/10'}`}
                      >
                        {fmt.toUpperCase()}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm text-zinc-300">Quality</label>
                  <span className="text-xs text-zinc-400">{Math.round(exportQuality * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={exportQuality}
                  onChange={(e) => setExportQuality(Number(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-zinc-400 mt-1">Applied for JPEG/WEBP</p>
              </div>

              <div>
                <label className="block text-sm text-zinc-300 mb-2">Resize</label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="1"
                      value={exportWidth}
                      onChange={(e) => {
                        const w = Math.max(1, Number(e.target.value));
                        setExportWidth(w);
                        if (lockAspect && canvasSize.width > 0 && canvasSize.height > 0) {
                          const ratio = canvasSize.height / canvasSize.width;
                          setExportHeight(Math.round(w * ratio));
                        }
                      }}
                      className="w-28 border border-white/15 bg-white/10 text-white rounded-lg p-2 focus:outline-none"
                    />
                    <span className="text-xs text-zinc-400">px</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLockAspect(!lockAspect)}
                    className="p-2 rounded-lg bg-white/10 border border-white/15 hover:bg-white/20"
                    title={lockAspect ? 'Unlock aspect ratio' : 'Lock aspect ratio'}
                  >
                    {lockAspect ? <Lock size={16} className="text-pink-400"/> : <Unlock size={16} className="text-pink-400"/>}
                  </button>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="1"
                      value={exportHeight}
                      onChange={(e) => {
                        const h = Math.max(1, Number(e.target.value));
                        setExportHeight(h);
                        if (lockAspect && canvasSize.width > 0 && canvasSize.height > 0) {
                          const ratio = canvasSize.width / canvasSize.height;
                          setExportWidth(Math.round(h * ratio));
                        }
                      }}
                      className="w-28 border border-white/15 bg-white/10 text-white rounded-lg p-2 focus:outline-none"
                    />
                    <span className="text-xs text-zinc-400">px</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-6">
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-5 py-2 bg-white/10 text-zinc-200 rounded-full hover:bg-white/20 transition-colors border border-white/15"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={saveToGallery}
                className="px-5 py-2 rounded-full font-semibold text-white bg-gradient-to-r from-fuchsia-600 via-purple-600 to-blue-500 hover:from-fuchsia-500 hover:via-purple-500 hover:to-blue-400 active:scale-95 shadow disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={saving}
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gallery Picker Modal */}
      {showGalleryPicker && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white/10 border border-white/10 rounded-2xl p-6 w-[900px] max-h-[80vh] shadow-xl backdrop-blur-xl flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Upload from My Gallery</h3>
              <button onClick={() => setShowGalleryPicker(false)} className="p-1 rounded hover:bg-white/10">✕</button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-4 border-b border-white/10 pb-2">
              {['uploaded','generated','saved','finalized'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveGalleryTab(tab)}
                  className={`px-4 py-1.5 text-sm rounded-full transition-colors ${
                    activeGalleryTab === tab
                      ? 'bg-gradient-to-r from-fuchsia-600 via-purple-600 to-blue-500 text-white'
                      : 'bg-white/10 text-zinc-300 hover:bg-white/20 border border-white/10'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {galleryLoading ? (
                <div className="h-48 flex items-center justify-center text-zinc-300">Loading…</div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {galleryImages.length === 0 && (
                    <div className="col-span-full text-center text-zinc-400">No images found.</div>
                  )}
                  {galleryImages.map(img => (
                    <button
                      key={img.id}
                      onClick={() => loadFromGallery(img)}
                      className="group relative aspect-square rounded-xl overflow-hidden border border-white/10 bg-black/30 hover:border-fuchsia-500/50"
                      title={img.name}
                    >
                      <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-x-0 bottom-0 bg-black/50 text-white text-xs px-2 py-1 truncate">{img.name}</div>
                      <div className="absolute inset-0 ring-2 ring-transparent group-hover:ring-fuchsia-500/60 rounded-xl" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 pt-4">
              <button
                onClick={() => setShowGalleryPicker(false)}
                className="px-5 py-2 bg-white/10 text-zinc-200 rounded-full hover:bg-white/20 transition-colors border border-white/15"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODIFIED: Text Input/Edit Modal */}
      {tempText && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white/10 border border-white/10 rounded-xl p-6 w-96 shadow-xl backdrop-blur-lg">
            <h3 className="text-lg font-semibold mb-4 text-white">
              {isEditingText ? 'Edit Text' : 'Add Text'}
            </h3>
            <textarea
              autoFocus
              value={tempText.text}
              onChange={(e) => setTempText({ ...tempText, text: e.target.value })}
              placeholder="Enter your text..."
              className="w-full border border-white/15 bg-white/10 text-white rounded-lg p-3 mb-4 min-h-24 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  handleTextSubmit();
                }
              }}
            />
            
            {/* NEW: Color and Font Size controls */}
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-zinc-300">Color:</label>
                <input
                  type="color"
                  value={tempText.fill} // Use tempText.fill
                  onChange={(e) => setTempText({ ...tempText, fill: e.target.value })}
                  className="w-10 h-10 rounded cursor-pointer border border-white/20 bg-white/10"
                />
              </div>
              <div className="flex-1 flex items-center gap-2">
                <label className="text-sm font-medium text-zinc-300">Size:</label>
                <input
                  type="range"
                  min="12"
                  max="72"
                  value={tempText.fontSize} // Use tempText.fontSize
                  onChange={(e) => setTempText({ ...tempText, fontSize: Number(e.target.value) })}
                  className="w-full"
                />
                <span className="text-sm text-zinc-400 w-8">{tempText.fontSize}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={() => { setTempText(null); setTool(TOOLS.SELECT); }}
                className="px-5 py-2 bg-white/10 text-zinc-200 rounded-full hover:bg-white/20 transition-colors border border-white/15"
              >
                Cancel
              </button>
              <button
                onClick={handleTextSubmit}
                className="px-5 py-2 rounded-full font-semibold text-white bg-gradient-to-r from-fuchsia-600 via-purple-600 to-blue-500 hover:from-fuchsia-500 hover:via-purple-500 hover:to-blue-400 active:scale-95 shadow"
              >
                {isEditingText ? 'Save Changes' : 'Add Text'}
              </button>
            </div>
            <p className="text-xs text-zinc-400 mt-2">Tip: Press Ctrl+Enter to submit</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageEditor;