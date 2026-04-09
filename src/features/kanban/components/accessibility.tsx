import { createContext, useContext, useEffect, useRef, useState, useCallback, useMemo } from 'react';

// ----- Типы для DnD мониторинга ------
export type DndMonitorEventHandler = {
  onDragStart?: (activeId: string) => void;
  onDragMove?: (activeId: string, overId?: string) => void;
  onDragOver?: (activeId: string, overId?: string) => void;
  onDragEnd?: (activeId: string, overId?: string) => void;
  onDragCancel?: (activeId: string) => void;
};

export type DndEventType = keyof DndMonitorEventHandler;

type DndMonitorContextValue = {
  activeIdRef: React.MutableRefObject<string>;
  registerMonitor: (monitor: DndMonitorEventHandler) => void;
  unregisterMonitor: (monitor: DndMonitorEventHandler) => void;
  triggerEvent: (eventType: DndEventType, activeId: string, overId?: string) => void;
};

const DndMonitorContext = createContext<DndMonitorContextValue | undefined>(undefined);

// ----- Провайдер DnD мониторинга -----

export const DndMonitorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const activeIdRef = useRef<string>('');
  const monitorsRef = useRef<DndMonitorEventHandler[]>([]);

  const registerMonitor = useCallback((monitor: DndMonitorEventHandler) => {
    monitorsRef.current.push(monitor);
  }, []);

  const unregisterMonitor = useCallback((monitor: DndMonitorEventHandler) => {
    monitorsRef.current = monitorsRef.current.filter(m => m !== monitor);
  }, []);

  const triggerEvent = useCallback((
    eventType: DndEventType,
    activeId: string,
    overId?: string
  ) => {
    monitorsRef.current.forEach(monitor => {
      const handler = monitor[eventType];
      if (handler) {
        handler(activeId, overId);
      }
    });
  }, []);

  const contextValue = useMemo(() => ({
    activeIdRef,
    registerMonitor,
    unregisterMonitor,
    triggerEvent,
  }), [registerMonitor, unregisterMonitor, triggerEvent]);

  return (
    <DndMonitorContext.Provider value={contextValue}>
      {children}
    </DndMonitorContext.Provider>
  );
};

// ----- Хук для подписки на DnD события -----

export const useDndMonitor = (monitor: DndMonitorEventHandler) => {
  const context = useContext(DndMonitorContext);
  
  if (!context) {
    throw new Error('useDndMonitor must be used within DndMonitorProvider');
  }

  useEffect(() => {
    context.registerMonitor(monitor);
    return () => context.unregisterMonitor(monitor);
  }, [monitor, context]);
};

// ----- Хук для доступа к DnD событиям -----

export const useDndEvents = () => {
  const context = useContext(DndMonitorContext);

  if (!context) {
    throw new Error('useDndEvents must be used within DndMonitorProvider');
  }

  const { activeIdRef, triggerEvent } = context;

  const onDragStart = useCallback((activeId: string) => {
    activeIdRef.current = activeId;
    triggerEvent('onDragStart', activeId);
  }, [triggerEvent, activeIdRef]);

  const onDragOver = useCallback((activeId: string, overId?: string) => {
    const actualActiveId = activeId || activeIdRef.current;
    triggerEvent('onDragOver', actualActiveId, overId);
  }, [triggerEvent, activeIdRef]);

  const onDragEnd = useCallback((activeId: string, overId?: string) => {
    triggerEvent('onDragEnd', activeId, overId);
  }, [triggerEvent]);

  const onDragCancel = useCallback((activeId: string) => {
    triggerEvent('onDragCancel', activeId);
  }, [triggerEvent]);

  return {
    onDragStart,
    onDragOver,
    onDragEnd,
    onDragCancel,
  };
};

// ----- Хук для accessibility объявлений -----

export const useAnnouncement = () => {
  const [announcement, setAnnouncement] = useState('');
  
  const announce = useCallback((value: string | undefined) => {
    if (value !== undefined && value !== null) {
      setAnnouncement(value);
      setTimeout(() => {
        setAnnouncement('');
      }, 5000);
    }
  }, []);

  return { announce, announcement };
};

// ----- Компонент Live Region для скринридеров -----

export const LiveRegion: React.FC<{ announcement: string }> = ({ announcement }) => {
  if (!announcement) return null;
  
  return (
    <div
      aria-live="assertive"
      aria-atomic
      className="sr-only"
      role="status"
    >
      {announcement}
    </div>
  );
};

// ----- Скрытые инструкции для скринридеров -----

export const HiddenInstructions: React.FC<{ id: string }> = ({ id }) => {
  const instructions = `
    Чтобы поднять задачу, нажмите и удерживайте левую кнопку мыши.
    Во время перетаскивания используйте указатель мыши для перемещения.
    Отпустите кнопку мыши, чтобы поместить задачу в новое место.
    Нажмите Escape, чтобы отменить перетаскивание.
  `;

  return (
    <div id={id} className="sr-only">
      {instructions}
    </div>
  );
};

// ----- Компонент для отображения визуального фидбека -----

export const DragOverlay: React.FC<{
  isDragging: boolean;
  children?: React.ReactNode;
}> = ({ isDragging, children }) => {
  if (!isDragging) return null;
  
  return (
    <div className="fixed pointer-events-none z-50 transform rotate-3 shadow-xl">
      {children}
    </div>
  );
};