import React, { createContext, useContext, useState } from "react";

const DragCtx = createContext<{
  isDragging: boolean;
  setIsDragging: (v: boolean) => void;
}>({ isDragging: false, setIsDragging: () => {} });

export const DragProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  return (
    <DragCtx.Provider value={{ isDragging, setIsDragging }}>
      {children}
    </DragCtx.Provider>
  );
};

export function useDragCtx() {
  return useContext(DragCtx);
}
