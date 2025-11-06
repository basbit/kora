import React, { useEffect, useRef } from "react";
import { Pressable, Text, View } from "react-native";
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
} from "@shared/lib/storage/asyncStorage";

import { useDragCtx } from "./DragContext";

import type {
  PanGestureHandlerGestureEvent,
  PinchGestureHandlerGestureEvent,
} from "react-native-gesture-handler";

export const ZoomPanView: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
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
      const saved = await loadViewStateFromStorage();
      if (saved) {
        baseScale.value = saved.scale;
        offsetX.value = saved.offsetX;
        offsetY.value = saved.offsetY;
      }
    })();
  }, []);

  const scheduleStateSave = () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveViewStateToStorage({
        scale: baseScale.value,
        offsetX: offsetX.value,
        offsetY: offsetY.value,
      }).catch(() => undefined);
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
