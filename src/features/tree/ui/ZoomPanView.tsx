import React, { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, Text, View, Platform } from "react-native";
import {
  PinchGestureHandler,
  PanGestureHandler,
} from "react-native-gesture-handler";
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  runOnJS,
} from "react-native-reanimated";

import {
  saveViewStateToStorage,
  loadViewStateFromStorage,
  saveViewStateById,
  loadViewStateById,
} from "@shared/lib/storage/indexedDB";

import { useTreeStore } from "@app/providers/StoreProvider";

import { useDragCtx } from "./DragContext";

import type {
  PanGestureHandlerGestureEvent,
  PinchGestureHandlerGestureEvent,
} from "react-native-gesture-handler";

const ZoomPanViewWeb: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { treeId } = useTreeStore();
  const { isDragging: isNodeDragging } = useDragCtx();
  const [scale, setScale] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const viewStateRef = useRef({ scale: 1, offsetX: 0, offsetY: 0 });

  useEffect(() => {
    (async () => {
      const saved = treeId
        ? await loadViewStateById(treeId)
        : await loadViewStateFromStorage();
      if (saved) {
        setScale(saved.scale);
        setOffsetX(saved.offsetX);
        setOffsetY(saved.offsetY);
      }
    })();
  }, [treeId]);

  useEffect(() => {
    viewStateRef.current = { scale, offsetX, offsetY };
  }, [scale, offsetX, offsetY]);

  const scheduleStateSave = useCallback(
    (next?: { scale: number; offsetX: number; offsetY: number }) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      const snapshot = next ?? viewStateRef.current;
      saveTimeoutRef.current = setTimeout(() => {
        const savePromise = treeId
          ? saveViewStateById(treeId, snapshot)
          : saveViewStateToStorage(snapshot);
        savePromise.catch(() => undefined);
      }, 500);
    },
    [treeId],
  );

  const containerRef = useRef<HTMLDivElement>(null);

  const applyScale = useCallback(
    (targetScale: number, focusPoint?: { x: number; y: number }) => {
      const clamped = Math.min(2.5, Math.max(0.4, targetScale));
      const rect = containerRef.current?.getBoundingClientRect();
      const fallbackFocus = rect
        ? { x: rect.width / 2, y: rect.height / 2 }
        : { x: 0, y: 0 };
      const focus = focusPoint ?? fallbackFocus;
      if (clamped === scale) {
        return;
      }
      const ratio = clamped / scale;
      const newOffsetX = offsetX * ratio + focus.x * (1 - ratio);
      const newOffsetY = offsetY * ratio + focus.y * (1 - ratio);
      setOffsetX(newOffsetX);
      setOffsetY(newOffsetY);
      setScale(clamped);
      scheduleStateSave({
        scale: clamped,
        offsetX: newOffsetX,
        offsetY: newOffsetY,
      });
    },
    [scale, offsetX, offsetY, scheduleStateSave],
  );

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = -e.deltaY * 0.01;
        const rect = element.getBoundingClientRect();
        applyScale(scale + delta, {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    };

    element.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      element.removeEventListener("wheel", handleWheel);
    };
  }, [scale, applyScale]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isNodeDragging) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - offsetX, y: e.clientY - offsetY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && !isNodeDragging) {
      setOffsetX(e.clientX - dragStart.x);
      setOffsetY(e.clientY - dragStart.y);
    }
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      scheduleStateSave();
    }
  };

  useEffect(() => {
    if (isNodeDragging && isDragging) {
      setIsDragging(false);
    }
  }, [isNodeDragging, isDragging]);

  // Cleanup pending save on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const zoomOut = () => {
    applyScale(scale - 0.1);
  };

  const zoomIn = () => {
    applyScale(scale + 0.1);
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{
        flex: 1,
        overflow: "hidden",
        cursor: isDragging ? "grabbing" : "grab",
        position: "relative",
      }}
    >
      <div
        style={{
          transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale})`,
          transformOrigin: "0 0",
          width: "100%",
          height: "100%",
        }}
      >
        {children}
      </div>
      <div
        style={{
          position: "absolute",
          left: 12,
          bottom: 12,
          display: "flex",
          gap: 8,
        }}
      >
        <button
          onClick={zoomOut}
          style={{
            backgroundColor: "#eeeeee",
            paddingLeft: 12,
            paddingRight: 12,
            paddingTop: 8,
            paddingBottom: 8,
            borderRadius: 8,
            border: "none",
            fontSize: 18,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          -
        </button>
        <button
          onClick={zoomIn}
          style={{
            backgroundColor: "#eeeeee",
            paddingLeft: 12,
            paddingRight: 12,
            paddingTop: 8,
            paddingBottom: 8,
            borderRadius: 8,
            border: "none",
            fontSize: 18,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          +
        </button>
      </div>
    </div>
  );
};

const ZoomPanViewMobile: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { treeId } = useTreeStore();
  const baseScale = useSharedValue(1);
  const pinchScale = useSharedValue(1);

  const offsetX = useSharedValue(0);
  const offsetY = useSharedValue(0);
  const translationX = useSharedValue(0);
  const translationY = useSharedValue(0);

  const { isDragging } = useDragCtx();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    (async () => {
      const saved = treeId
        ? await loadViewStateById(treeId)
        : await loadViewStateFromStorage();
      if (saved) {
        baseScale.value = saved.scale;
        offsetX.value = saved.offsetX;
        offsetY.value = saved.offsetY;
      }
    })();
  }, [treeId]);

  const scheduleStateSave = () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      const savePromise = treeId
        ? saveViewStateById(treeId, {
            scale: baseScale.value,
            offsetX: offsetX.value,
            offsetY: offsetY.value,
          })
        : saveViewStateToStorage({
            scale: baseScale.value,
            offsetX: offsetX.value,
            offsetY: offsetY.value,
          });
      savePromise.catch(() => undefined);
    }, 500);
  };

  const pinchHandler =
    useAnimatedGestureHandler<PinchGestureHandlerGestureEvent>({
      onActive: (e) => {
        const s = Math.min(2.5, Math.max(0.4, e.scale));
        pinchScale.value = s;
      },
      onEnd: () => {
        baseScale.value = Math.min(
          2.5,
          Math.max(0.4, baseScale.value * pinchScale.value),
        );
        pinchScale.value = withTiming(1);
        runOnJS(scheduleStateSave)();
      },
    });

  const panHandler = useAnimatedGestureHandler<PanGestureHandlerGestureEvent>({
    onActive: (e) => {
      translationX.value = e.translationX;
      translationY.value = e.translationY;
    },
    onEnd: () => {
      offsetX.value = offsetX.value + translationX.value;
      offsetY.value = offsetY.value + translationY.value;
      translationX.value = withTiming(0);
      translationY.value = withTiming(0);
      runOnJS(scheduleStateSave)();
    },
  });

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: offsetX.value + translationX.value },
      { translateY: offsetY.value + translationY.value },
      { scale: baseScale.value * pinchScale.value },
    ],
  }));

  // Cleanup pending save on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const zoomOut = () => {
    baseScale.value = Math.max(0.4, baseScale.value - 0.1);
    scheduleStateSave();
  };
  const zoomIn = () => {
    baseScale.value = Math.min(2.5, baseScale.value + 0.1);
    scheduleStateSave();
  };

  return (
    <PanGestureHandler onGestureEvent={panHandler} enabled={!isDragging}>
      <Animated.View style={{ flex: 1 }}>
        <PinchGestureHandler
          onGestureEvent={pinchHandler}
          enabled={!isDragging}
        >
          <Animated.View style={{ flex: 1 }}>
            <Animated.View style={[{ flex: 1 }, style]}>
              {children}
            </Animated.View>
            <View
              style={{
                position: "absolute",
                left: 12,
                bottom: 12,
                flexDirection: "row",
                gap: 8,
              }}
            >
              <Pressable
                onPress={zoomOut}
                style={{
                  backgroundColor: "#eeeeee",
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 8,
                }}
              >
                <Text style={{ fontSize: 18, fontWeight: "600" }}>-</Text>
              </Pressable>
              <Pressable
                onPress={zoomIn}
                style={{
                  backgroundColor: "#eeeeee",
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 8,
                }}
              >
                <Text style={{ fontSize: 18, fontWeight: "600" }}>+</Text>
              </Pressable>
            </View>
          </Animated.View>
        </PinchGestureHandler>
      </Animated.View>
    </PanGestureHandler>
  );
};

export const ZoomPanView: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  if (Platform.OS === "web") {
    return <ZoomPanViewWeb>{children}</ZoomPanViewWeb>;
  }
  return <ZoomPanViewMobile>{children}</ZoomPanViewMobile>;
};
