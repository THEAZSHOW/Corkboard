import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { ItemType, BoardItemData, Theme, CorkboardMeta, Connection, CorkboardData } from './types';
import { NOTE_COLORS, INITIAL_Z_INDEX, FONT_SIZE_DEFAULT } from './constants';
import Toolbar from './components/Toolbar';
import BoardItem from './components/BoardItem';
import InputDialog from './components/InputDialog';
import EmojiPicker from './components/EmojiPicker';
import Connector from './components/Connector';
import useBoardInteraction from './hooks/useBoardInteraction';
import { usePersistentHistory } from './hooks/usePersistentHistory';

interface AppProps {
  board: CorkboardMeta;
}

const THEMES: Theme[] = ['white', 'dark', 'orange'];

const App: React.FC<AppProps> = ({ board }) => {
  const { state, setState, undo, redo, canUndo, canRedo } = usePersistentHistory<{items: BoardItemData[], connections: Connection[]}>(`corkboard-${board.id}`, { items: [], connections: [] });
  const { items, connections } = state;

  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [zIndexCounter, setZIndexCounter] = useState<number>(() => {
    if (items.length === 0) return INITIAL_Z_INDEX;
    return Math.max(...items.map(item => item.zIndex), INITIAL_Z_INDEX);
  });
  const [theme, setTheme] = useState<Theme>('white');
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [transientUpdate, setTransientUpdate] = useState<BoardItemData | null>(null);
  
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    type: ItemType.Video | null;
    title: string;
    placeholder: string;
    defaultValue?: string;
  }>({
    isOpen: false,
    type: null,
    title: '',
    placeholder: '',
    defaultValue: '',
  });

  const boardViewportRef = useRef<HTMLDivElement>(null);
  const { pan, zoom, setZoom } = useBoardInteraction(boardViewportRef);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      
      if (e.key === 'Escape') {
        e.preventDefault();
        setSelectedItemIds([]);
        return;
      }

      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') {
          e.preventDefault();
          e.shiftKey ? redo() : undo();
        } else if (e.key === 'y') {
            e.preventDefault();
            redo();
        }
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedItemIds.length > 0) {
        e.preventDefault();
        setState(prev => ({
            items: prev.items.filter(item => !selectedItemIds.includes(item.id)),
            connections: prev.connections.filter(conn => !selectedItemIds.includes(conn.fromId) && !selectedItemIds.includes(conn.toId))
        }));
        setSelectedItemIds([]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, setState, selectedItemIds]);

  const getCenterPosition = () => {
    if (!boardViewportRef.current) return { x: 2500, y: 2500 };
    const rect = boardViewportRef.current.getBoundingClientRect();
    return {
      x: (rect.width / 2 - pan.x) / zoom,
      y: (rect.height / 2 - pan.y) / zoom,
    };
  };

  const addNewItem = (type: ItemType, content: string, extra: Partial<BoardItemData> = {}) => {
    const center = getCenterPosition();
    const newZ = zIndexCounter + 1;
    const newItem: BoardItemData = {
      id: `item-${Date.now()}`,
      type,
      x: center.x - 125,
      y: center.y - 125,
      width: 250,
      height: 250,
      rotation: 0,
      zIndex: newZ,
      content,
      color: type === ItemType.Note ? NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)] : undefined,
      fontSize: type === ItemType.Note ? FONT_SIZE_DEFAULT : undefined,
      ...extra,
    };
    setState(prev => ({...prev, items: [...prev.items, newItem]}));
    setZIndexCounter(newZ);
    setSelectedItemIds([newItem.id]);
  };
  
  const handleAddItem = (type: ItemType) => {
    if (type === ItemType.Note) {
      addNewItem(ItemType.Note, 'Write something...');
    } else if (type === ItemType.Image) {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (readerEvent) => {
            if (readerEvent.target?.result) {
              addNewItem(ItemType.Image, readerEvent.target.result as string, { width: 400, height: 300 });
            }
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    } else if (type === ItemType.Video) {
      setDialogState({
        isOpen: true,
        type: ItemType.Video,
        title: 'Add YouTube Video',
        placeholder: 'https://www.youtube.com/watch?v=...',
        defaultValue: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      });
    } else if (type === ItemType.Emoji) {
      setIsEmojiPickerOpen(true);
    }
  };

  const closeDialog = () => setDialogState(prev => ({ ...prev, isOpen: false }));

  const handleDialogSubmit = (value: string) => {
    if (dialogState.type === ItemType.Video) {
      addNewItem(ItemType.Video, value, { width: 480, height: 270 });
    }
    closeDialog();
  };
  
  const handleEmojiSelect = (emoji: { native: string }) => {
    addNewItem(ItemType.Emoji, emoji.native, { width: 150, height: 150 });
    setIsEmojiPickerOpen(false);
  };

  const handleUpdateItem = useCallback((id: string, updates: Partial<BoardItemData>) => {
    setState(prev => ({ ...prev, items: prev.items.map(item => (item.id === id ? { ...item, ...updates } : item)) }));
  }, [setState]);

  const handleDeleteItem = useCallback((id:string) => {
    setState(prev => ({
      items: prev.items.filter(item => item.id !== id),
      connections: prev.connections.filter(conn => conn.fromId !== id && conn.toId !== id)
    }));
    setSelectedItemIds(prev => prev.filter(selectedId => selectedId !== id));
  }, [setState]);

  const handleSelectItem = useCallback((id: string, isShiftPressed: boolean) => {
    setSelectedItemIds(prevSelectedIds => {
        if (isShiftPressed) {
            // Toggle selection for shift-clicks
            if (prevSelectedIds.includes(id)) {
                return prevSelectedIds.filter(selectedId => selectedId !== id);
            } else {
                return [...prevSelectedIds, id];
            }
        } else {
            // If not shift-clicking, select only the clicked item
            // unless it's already the only one selected (to allow dragging)
            if (prevSelectedIds.length === 1 && prevSelectedIds[0] === id) {
                return prevSelectedIds;
            }
            return [id];
        }
    });

    // Bring the most recently selected item to the front
    const itemToSelect = items.find(item => item.id === id);
    if (itemToSelect) {
        const maxZ = Math.max(...items.map(i => i.zIndex), 0);
        if (itemToSelect.zIndex <= maxZ) {
            const newZ = zIndexCounter + 1;
            setZIndexCounter(newZ);
            handleUpdateItem(id, { zIndex: newZ });
        }
    }
  }, [items, handleUpdateItem, zIndexCounter]);

  const handleBoardClick = (e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (!target.closest('.board-item-container') && !target.closest('.absolute.w-6.h-6')) {
        setSelectedItemIds([]);
    }
  };

  const handleThemeChange = () => setTheme(currentTheme => THEMES[(THEMES.indexOf(currentTheme) + 1) % THEMES.length]);

  const handleBackup = () => {
    const dataStr = JSON.stringify({ name: board.name, items, connections }, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `${board.name.replace(/\s+/g, '_')}_backup.json`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleLoadBackup = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = e => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = readerEvent => {
        try {
          const data = JSON.parse(readerEvent.target?.result as string) as CorkboardData;
          if (data && Array.isArray(data.items)) {
            setState({ items: data.items, connections: data.connections || [] });
            const maxZ = data.items.length > 0 ? Math.max(...data.items.map(i => i.zIndex)) : INITIAL_Z_INDEX;
            setZIndexCounter(maxZ);
          } else {
            alert('Invalid backup file format.');
          }
        } catch (error) {
          console.error('Failed to load backup:', error);
          alert('Failed to parse backup file. Make sure it is a valid JSON file.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleZIndex = (itemId: string, direction: 'forward' | 'backward') => {
    const sortedItems = [...items].sort((a, b) => a.zIndex - b.zIndex || a.id.localeCompare(b.id));
    const currentIndex = sortedItems.findIndex(item => item.id === itemId);

    if (direction === 'forward' && currentIndex < sortedItems.length - 1) {
      const otherItem = sortedItems[currentIndex + 1];
      handleUpdateItem(itemId, { zIndex: otherItem.zIndex });
      handleUpdateItem(otherItem.id, { zIndex: sortedItems[currentIndex].zIndex });
    } else if (direction === 'backward' && currentIndex > 0) {
      const otherItem = sortedItems[currentIndex - 1];
      handleUpdateItem(itemId, { zIndex: otherItem.zIndex });
      handleUpdateItem(otherItem.id, { zIndex: sortedItems[currentIndex].zIndex });
    }
  };
  
  const handleConnectItems = () => {
    if (selectedItemIds.length < 2) return;

    const newConnections: Connection[] = [];
    for (let i = 0; i < selectedItemIds.length - 1; i++) {
        const fromId = selectedItemIds[i];
        const toId = selectedItemIds[i + 1];

        const connectionExists = connections.some(
            conn => (conn.fromId === fromId && conn.toId === toId) || (conn.fromId === toId && conn.toId === fromId)
        );

        if (!connectionExists) {
            newConnections.push({
                id: `conn-${fromId}-${toId}-${Date.now()}`,
                fromId,
                toId,
            });
        }
    }

    if (newConnections.length > 0) {
        setState(prev => ({ ...prev, connections: [...prev.connections, ...newConnections] }));
    }
  };
  
  const handleTransientUpdate = useCallback((update: BoardItemData | null) => {
    setTransientUpdate(update);
  }, []);

  const displayedItems = useMemo(() => {
    if (!transientUpdate) return items;
    return items.map(item => item.id === transientUpdate.id ? transientUpdate : item);
  }, [items, transientUpdate]);


  return (
    <div className={`w-screen h-screen flex flex-col overflow-hidden theme-${theme}`}>
      <Toolbar 
        onAddItem={handleAddItem} 
        zoomLevel={zoom} 
        onZoomChange={setZoom}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        onThemeChange={handleThemeChange}
        onBackup={handleBackup}
        onLoad={handleLoadBackup}
        boardName={board.name}
      />
       {selectedItemIds.length >= 2 && (
        <button
          onClick={handleConnectItems}
          className="absolute top-24 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-blue-600 text-white font-bold rounded-full shadow-lg hover:bg-blue-700 transition-all transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-400"
          aria-label={`Connect ${selectedItemIds.length} items`}
        >
          Connect ({selectedItemIds.length})
        </button>
      )}
      <div
        ref={boardViewportRef}
        className="flex-grow w-full h-full overflow-hidden cursor-grab active:cursor-grabbing"
        onPointerDown={handleBoardClick}
      >
        <div
          className={`absolute transform-gpu theme-${theme}`}
          style={{
            width: 5000,
            height: 5000,
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
          }}
        >
          <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
            <g>
              {connections.map(conn => {
                const fromItem = displayedItems.find(i => i.id === conn.fromId);
                const toItem = displayedItems.find(i => i.id === conn.toId);
                return fromItem && toItem ? <Connector key={conn.id} fromItem={fromItem} toItem={toItem} /> : null;
              })}
            </g>
          </svg>
          {displayedItems.map(item => (
            <BoardItem
              key={item.id}
              item={item}
              onUpdate={handleUpdateItem}
              onDelete={handleDeleteItem}
              onSelect={handleSelectItem}
              isSelected={selectedItemIds.includes(item.id)}
              scale={zoom}
              onBringForward={() => handleZIndex(item.id, 'forward')}
              onSendBackward={() => handleZIndex(item.id, 'backward')}
              onTransientUpdate={handleTransientUpdate}
            />
          ))}
        </div>
      </div>
      <InputDialog
        isOpen={dialogState.isOpen}
        onClose={closeDialog}
        onSubmit={handleDialogSubmit}
        title={dialogState.title}
        placeholder={dialogState.placeholder}
        defaultValue={dialogState.defaultValue}
        submitButtonText="Add"
      />
      {isEmojiPickerOpen && (
        <EmojiPicker 
          onEmojiSelect={handleEmojiSelect}
          onClose={() => setIsEmojiPickerOpen(false)}
        />
      )}
    </div>
  );
};

export default App;