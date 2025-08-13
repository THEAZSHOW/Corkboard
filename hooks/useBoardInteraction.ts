
import { useState, useEffect, useRef, RefObject } from 'react';
import { ZOOM_MIN, ZOOM_MAX, ZOOM_SENSITIVITY } from '../constants';

interface PanState {
  x: number;
  y: number;
}

const useBoardInteraction = (ref: RefObject<HTMLDivElement>) => {
  const [pan, setPan] = useState<PanState>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const isPanning = useRef(false);
  const lastPointerPosition = useRef<PanState>({ x: 0, y: 0 });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handlePointerDown = (e: PointerEvent) => {
      // Only pan if clicking on the board itself, not an item on it
      if ((e.target as HTMLElement).isEqualNode(element) || (e.target as HTMLElement).parentElement?.isEqualNode(element)) {
        isPanning.current = true;
        lastPointerPosition.current = { x: e.clientX, y: e.clientY };
        element.style.cursor = 'grabbing';
      }
    };

    const handlePointerUp = () => {
      isPanning.current = false;
      element.style.cursor = 'grab';
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isPanning.current) return;
      const dx = e.clientX - lastPointerPosition.current.x;
      const dy = e.clientY - lastPointerPosition.current.y;
      setPan(prevPan => ({ x: prevPan.x + dx, y: prevPan.y + dy }));
      lastPointerPosition.current = { x: e.clientX, y: e.clientY };
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = element.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const newZoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoom - e.deltaY * ZOOM_SENSITIVITY));
      
      const mousePointTo = {
        x: (mouseX - pan.x) / zoom,
        y: (mouseY - pan.y) / zoom,
      };

      setPan({
        x: mouseX - mousePointTo.x * newZoom,
        y: mouseY - mousePointTo.y * newZoom,
      });

      setZoom(newZoom);
    };

    element.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointermove', handlePointerMove);
    element.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      element.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointermove', handlePointerMove);
      element.removeEventListener('wheel', handleWheel);
    };
  }, [pan.x, pan.y, ref, zoom]);

  return { pan, zoom, setZoom };
};

export default useBoardInteraction;
