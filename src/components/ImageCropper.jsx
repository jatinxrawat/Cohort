import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/Button';
import { ZoomIn, ZoomOut, Move } from 'lucide-react';

export const ImageCropper = ({ imageSrc, onCrop, onCancel }) => {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [imgSize, setImgSize] = useState({ width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const imgRef = useRef(null);

  const handleImageLoad = (e) => {
    const { naturalWidth, naturalHeight } = e.target;
    const ratio = naturalWidth / naturalHeight;
    let width = 256;
    let height = 256;
    
    // Fit image to viewport so smaller dimension covers 256px
    if (ratio > 1) {
      width = 256 * ratio;
    } else {
      height = 256 / ratio;
    }
    setImgSize({ width, height });
    setPosition({ x: 0, y: 0 });
    setZoom(1);
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const newX = e.clientX - dragStart.current.x;
    const newY = e.clientY - dragStart.current.y;
    setPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e) => {
    if (e.touches.length !== 1) return;
    setIsDragging(true);
    const touch = e.touches[0];
    dragStart.current = { x: touch.clientX - position.x, y: touch.clientY - position.y };
  };

  const handleTouchMove = (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const newX = touch.clientX - dragStart.current.x;
    const newY = touch.clientY - dragStart.current.y;
    setPosition({ x: newX, y: newY });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleCropSave = () => {
    if (!imgRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Draw background color
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 256, 256);

    // Apply translations and zoom from center (128, 128)
    ctx.translate(128 + position.x, 128 + position.y);
    ctx.scale(zoom, zoom);

    // Draw natural dimension centered
    const left = -imgSize.width / 2;
    const top = -imgSize.height / 2;
    ctx.drawImage(imgRef.current, left, top, imgSize.width, imgSize.height);

    canvas.toBlob((blob) => {
      if (blob) {
        const croppedFile = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
        onCrop(croppedFile);
      }
    }, 'image/jpeg', 0.9);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-md bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-xl max-w-sm w-full space-y-lg shadow-2xl flex flex-col items-center animate-in zoom-in-95 duration-200">
        <div className="text-center">
          <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Crop Profile Picture</h3>
          <p className="text-xs text-neutral-500 mt-xs">Drag to pan, slide to zoom. Ensure your face fits inside the circle.</p>
        </div>

        {/* Circular Viewport */}
        <div className="relative group">
          <div
            className="w-64 h-64 rounded-full border-4 border-primary-500 overflow-hidden relative cursor-move bg-neutral-950 shadow-inner select-none flex items-center justify-center"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <img
              ref={imgRef}
              src={imageSrc}
              onLoad={handleImageLoad}
              alt="Cropping Profile Picture"
              draggable={false}
              style={{
                width: imgSize.width,
                height: imgSize.height,
                transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                transformOrigin: 'center',
                position: 'absolute',
                left: (256 - imgSize.width) / 2,
                top: (256 - imgSize.height) / 2,
                maxWidth: 'none',
              }}
            />
          </div>
          <div className="absolute bottom-2 right-2 bg-neutral-900/60 p-1.5 rounded-full text-white pointer-events-none opacity-60">
            <Move className="w-4 h-4" />
          </div>
        </div>

        {/* Zoom Slider */}
        <div className="w-full space-y-xs px-xs">
          <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-wider text-neutral-400">
            <span className="flex items-center gap-xs"><ZoomOut className="w-3.5 h-3.5" /> Out</span>
            <span className="flex items-center gap-xs">In <ZoomIn className="w-3.5 h-3.5" /></span>
          </div>
          <input
            type="range"
            min="1"
            max="3"
            step="0.01"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-primary-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-md w-full pt-xs border-t border-neutral-100 dark:border-neutral-800">
          <Button variant="secondary" className="flex-1" type="button" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" className="flex-1" type="button" onClick={handleCropSave}>
            Save Crop
          </Button>
        </div>
      </div>
    </div>
  );
};
