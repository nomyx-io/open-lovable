"use client";

import { ReactNode, createContext, useContext, useState, useCallback } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { cn } from "@/lib/utils";

interface ResizableLayoutContextType {
  chatPanelSize: number;
  setChatPanelSize: (size: number) => void;
  previewPanelSize: number;
  setPreviewPanelSize: (size: number) => void;
  isCollapsed: boolean;
  toggleCollapse: () => void;
}

const ResizableLayoutContext = createContext<ResizableLayoutContextType | null>(null);

export function useResizableLayout() {
  const context = useContext(ResizableLayoutContext);
  if (!context) {
    throw new Error("useResizableLayout must be used within a ResizableLayoutProvider");
  }
  return context;
}

interface ResizableLayoutProps {
  children: [ReactNode, ReactNode]; // [ChatPanel, PreviewPanel]
  defaultChatSize?: number;
  defaultPreviewSize?: number;
  minChatSize?: number;
  minPreviewSize?: number;
  direction?: "horizontal" | "vertical";
  className?: string;
}

export function ResizableLayout({
  children,
  defaultChatSize = 35,
  defaultPreviewSize = 65,
  minChatSize = 20,
  minPreviewSize = 30,
  direction = "horizontal",
  className,
}: ResizableLayoutProps) {
  const [chatPanelSize, setChatPanelSize] = useState(defaultChatSize);
  const [previewPanelSize, setPreviewPanelSize] = useState(defaultPreviewSize);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => !prev);
    if (isCollapsed) {
      setChatPanelSize(defaultChatSize);
      setPreviewPanelSize(defaultPreviewSize);
    } else {
      setChatPanelSize(0);
      setPreviewPanelSize(100);
    }
  }, [isCollapsed, defaultChatSize, defaultPreviewSize]);

  const [chatPanel, previewPanel] = children;

  return (
    <ResizableLayoutContext.Provider
      value={{
        chatPanelSize,
        setChatPanelSize,
        previewPanelSize,
        setPreviewPanelSize,
        isCollapsed,
        toggleCollapse,
      }}
    >
      <PanelGroup
        direction={direction}
        className={cn("h-full", className)}
      >
        {/* Chat Panel */}
        <Panel
          defaultSize={defaultChatSize}
          minSize={minChatSize}
          collapsible
          collapsedSize={0}
          onResize={(size) => {
            setChatPanelSize(size);
            setPreviewPanelSize(100 - size);
          }}
          className="transition-all duration-300"
        >
          {chatPanel}
        </Panel>

        {/* Resize Handle */}
        <PanelResizeHandle className="group relative flex items-center justify-center transition-colors data-[resize-handle-state=hover]:bg-orange-500/10 data-[resize-handle-state=drag]:bg-orange-500/20">
          {/* Visible handle bar */}
          <div
            className={cn(
              "z-10 transition-all duration-200",
              direction === "horizontal"
                ? "w-1 h-12 mx-1"
                : "h-1 w-12 my-1",
              "bg-gray-300 dark:bg-gray-600",
              "rounded-full",
              "group-hover:bg-orange-500 group-hover:shadow-lg group-hover:shadow-orange-500/20",
              "group-data-[resize-handle-state=drag]:bg-orange-500 group-data-[resize-handle-state=drag]:scale-110"
            )}
          />
          
          {/* Hit area for easier grabbing */}
          <div
            className={cn(
              "absolute",
              direction === "horizontal"
                ? "inset-y-0 -inset-x-1 cursor-col-resize"
                : "inset-x-0 -inset-y-1 cursor-row-resize"
            )}
          />
          
          {/* Drag indicator dots */}
          <div
            className={cn(
              "absolute flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity",
              direction === "horizontal" ? "flex-col" : "flex-row"
            )}
          >
            <div className="w-1 h-1 rounded-full bg-gray-400 dark:bg-gray-500" />
            <div className="w-1 h-1 rounded-full bg-gray-400 dark:bg-gray-500" />
            <div className="w-1 h-1 rounded-full bg-gray-400 dark:bg-gray-500" />
          </div>
        </PanelResizeHandle>

        {/* Preview Panel */}
        <Panel
          defaultSize={defaultPreviewSize}
          minSize={minPreviewSize}
          onResize={(size) => {
            setPreviewPanelSize(size);
            setChatPanelSize(100 - size);
          }}
          className="transition-all duration-300"
        >
          {previewPanel}
        </Panel>
      </PanelGroup>
    </ResizableLayoutContext.Provider>
  );
}

// Three-panel layout variant
interface ThreePanelLayoutProps {
  children: [ReactNode, ReactNode, ReactNode]; // [Left, Center, Right]
  defaultSizes?: [number, number, number];
  minSizes?: [number, number, number];
  className?: string;
}

export function ThreePanelLayout({
  children,
  defaultSizes = [25, 50, 25],
  minSizes = [15, 30, 15],
  className,
}: ThreePanelLayoutProps) {
  const [leftPanel, centerPanel, rightPanel] = children;

  return (
    <PanelGroup direction="horizontal" className={cn("h-full", className)}>
      <Panel defaultSize={defaultSizes[0]} minSize={minSizes[0]} collapsible>
        {leftPanel}
      </Panel>

      <PanelResizeHandle className="group relative flex items-center justify-center w-1 hover:w-2 transition-all data-[resize-handle-state=hover]:bg-orange-500/10">
        <div className="w-0.5 h-8 bg-gray-300 dark:bg-gray-600 rounded-full group-hover:bg-orange-500 transition-colors" />
      </PanelResizeHandle>

      <Panel defaultSize={defaultSizes[1]} minSize={minSizes[1]}>
        {centerPanel}
      </Panel>

      <PanelResizeHandle className="group relative flex items-center justify-center w-1 hover:w-2 transition-all data-[resize-handle-state=hover]:bg-orange-500/10">
        <div className="w-0.5 h-8 bg-gray-300 dark:bg-gray-600 rounded-full group-hover:bg-orange-500 transition-colors" />
      </PanelResizeHandle>

      <Panel defaultSize={defaultSizes[2]} minSize={minSizes[2]} collapsible>
        {rightPanel}
      </Panel>
    </PanelGroup>
  );
}

// Simple collapsible panel
interface CollapsiblePanelProps {
  children: ReactNode;
  collapsed?: boolean;
  collapsedSize?: number;
  defaultSize?: number;
  minSize?: number;
  className?: string;
}

export function CollapsiblePanel({
  children,
  collapsed = false,
  collapsedSize = 0,
  defaultSize = 30,
  minSize = 15,
  className,
}: CollapsiblePanelProps) {
  return (
    <Panel
      defaultSize={defaultSize}
      minSize={minSize}
      collapsible
      collapsedSize={collapsedSize}
      className={cn("transition-all duration-300", className)}
    >
      {children}
    </Panel>
  );
}