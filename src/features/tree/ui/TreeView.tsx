import { Ionicons } from "@expo/vector-icons";
import React, {
  useMemo,
  useRef,
  useState,
  useCallback,
  useEffect,
} from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  PanResponder,
  Modal,
  Text,
  Image,
  Pressable,
  Alert,
  ScrollView,
} from "react-native";
import Svg, { Path } from "react-native-svg";

import { colors } from "@shared/config/theme/colors";
import { NodeCard } from "@shared/ui/NodeCard";

import { AddPersonModal } from "@pages/home/ui/AddPersonModal";

import { useSettings } from "@app/providers/SettingsProvider";
import { useTreeStore } from "@app/providers/StoreProvider";

import { DragProvider, useDragCtx } from "./DragContext";
import { ZoomPanView } from "./ZoomPanView";

// Константы размеров карточки
const CARD_WIDTH = 100;
const AVATAR_SIZE = 64;
const CARD_HEIGHT = 110; // аватар 64 + отступ 6 + имя ~28 + даты ~18

const ParentEdge = React.memo<{
  from: string;
  to: string;
  getRealPosition: (id: string) => { x: number; y: number };
  positions: Record<string, { x: number; y: number }>;
  color: string;
}>(({ from, to, getRealPosition, positions, color }) => {
  const p1 = getRealPosition(from);
  const p2 = getRealPosition(to);

  if (!positions[from] || !positions[to]) {
    return null;
  }

  const deltaX = Math.abs(p1.x - p2.x);
  const threshold = 120;

  let startX, startY, endX, endY, path;

  if (deltaX > threshold && p1.y < p2.y + CARD_HEIGHT) {
    const isP1Left = p1.x < p2.x;

    if (isP1Left) {
      startX = p1.x + CARD_WIDTH;
      startY = p1.y + AVATAR_SIZE / 2;
      endX = p2.x;
      endY = p2.y + AVATAR_SIZE / 2;
    } else {
      startX = p1.x;
      startY = p1.y + AVATAR_SIZE / 2;
      endX = p2.x + CARD_WIDTH;
      endY = p2.y + AVATAR_SIZE / 2;
    }

    const controlOffset = Math.abs(endX - startX) / 2;
    path = `M ${startX},${startY} C ${startX + (isP1Left ? controlOffset : -controlOffset)},${startY} ${endX + (isP1Left ? -controlOffset : controlOffset)},${endY} ${endX},${endY}`;
  } else {
    const isP1Higher = p1.y < p2.y;

    if (isP1Higher) {
      startX = p1.x + CARD_WIDTH / 2;
      startY = p1.y + CARD_HEIGHT;
      endX = p2.x + CARD_WIDTH / 2;
      endY = p2.y;
    } else {
      startX = p1.x + CARD_WIDTH / 2;
      startY = p1.y;
      endX = p2.x + CARD_WIDTH / 2;
      endY = p2.y + CARD_HEIGHT;
    }

    const controlOffset = Math.abs(endY - startY) / 2;
    path = `M ${startX},${startY} C ${startX},${startY + (isP1Higher ? controlOffset : -controlOffset)} ${endX},${endY + (isP1Higher ? -controlOffset : controlOffset)} ${endX},${endY}`;
  }

  return <Path d={path} stroke={color} strokeWidth={2} fill="none" />;
});

ParentEdge.displayName = "ParentEdge";

// Компонент для отрисовки одной линии супругов
const SpouseEdge = React.memo<{
  a: string;
  b: string;
  getRealPosition: (id: string) => { x: number; y: number };
  color: string;
}>(({ a, b, getRealPosition, color }) => {
  const p1 = getRealPosition(a);
  const p2 = getRealPosition(b);

  const deltaY = Math.abs(p1.y - p2.y);
  const threshold = 80;

  let startX, startY, endX, endY, path;

  if (deltaY > threshold) {
    const isP1Higher = p1.y < p2.y;

    if (isP1Higher) {
      startX = p1.x + CARD_WIDTH / 2;
      startY = p1.y + CARD_HEIGHT;
      endX = p2.x + CARD_WIDTH / 2;
      endY = p2.y;
    } else {
      startX = p1.x + CARD_WIDTH / 2;
      startY = p1.y;
      endX = p2.x + CARD_WIDTH / 2;
      endY = p2.y + CARD_HEIGHT;
    }

    const controlOffset = Math.abs(endY - startY) / 2;
    path = `M ${startX},${startY} C ${startX},${startY + (isP1Higher ? controlOffset : -controlOffset)} ${endX},${endY + (isP1Higher ? -controlOffset : controlOffset)} ${endX},${endY}`;
  } else {
    const isP1Left = p1.x < p2.x;

    if (isP1Left) {
      startX = p1.x + CARD_WIDTH;
      startY = p1.y + AVATAR_SIZE / 2;
      endX = p2.x;
      endY = p2.y + AVATAR_SIZE / 2;
    } else {
      startX = p1.x;
      startY = p1.y + AVATAR_SIZE / 2;
      endX = p2.x + CARD_WIDTH;
      endY = p2.y + AVATAR_SIZE / 2;
    }

    const controlOffset = Math.abs(endX - startX) / 2;
    path = `M ${startX},${startY} C ${startX + (isP1Left ? controlOffset : -controlOffset)},${startY} ${endX + (isP1Left ? -controlOffset : controlOffset)},${endY} ${endX},${endY}`;
  }

  return <Path d={path} stroke={color} strokeWidth={2} fill="none" />;
});

SpouseEdge.displayName = "SpouseEdge";

export const TreeView: React.FC<{ rootId: string }> = ({ rootId }) => {
  const { personsById } = useTreeStore();
  const root = personsById[rootId];
  if (!root) return null;

  return (
    <DragProvider>
      <ZoomPanView>
        <TreeCanvas rootId={rootId} />
      </ZoomPanView>
    </DragProvider>
  );
};

const TreeCanvas: React.FC<{ rootId: string }> = ({ rootId: _rootId }) => {
  const { personsById, positions } = useTreeStore();
  const { currentTheme } = useSettings();
  const theme = currentTheme === "dark" ? colors.dark : colors.light;

  // Используем useRef для dragOffsets чтобы избежать частых ре-рендеров
  const dragOffsetsRef = useRef<Record<string, { x: number; y: number }>>({});
  const [, forceUpdate] = useState({});
  const rafIdRef = useRef<number | null>(null);

  // Показываем все узлы (включая «корни» без родителей)
  const nodes: string[] = useMemo(
    () => Object.keys(personsById),
    [personsById],
  );

  // Функция для получения реальной позиции с учетом перетаскивания
  const getRealPosition = useCallback(
    (id: string) => {
      const basePos = positions[id] ?? { x: 0, y: 0 };
      const offset = dragOffsetsRef.current[id] ?? { x: 0, y: 0 };
      return { x: basePos.x + offset.x, y: basePos.y + offset.y };
    },
    [positions],
  );

  // Callback для обновления офсета с throttle через RAF
  const handleDragOffset = useCallback(
    (id: string, offset: { x: number; y: number }) => {
      dragOffsetsRef.current[id] = offset;

      // Throttle обновлений через requestAnimationFrame
      if (rafIdRef.current === null) {
        rafIdRef.current = requestAnimationFrame(() => {
          forceUpdate({});
          rafIdRef.current = null;
        });
      }
    },
    [],
  );

  // Очистка RAF при размонтировании
  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  // Строим рёбра по всем parentIds
  const parentEdges = useMemo(() => {
    const list: Array<{ from: string; to: string }> = [];
    for (const child of Object.values(personsById)) {
      for (const parentId of child.parentIds) {
        if (personsById[parentId]) list.push({ from: parentId, to: child.id });
      }
    }
    return list;
  }, [personsById]);

  const spouseEdges = useMemo(() => {
    const set = new Set<string>();
    const list: Array<{ a: string; b: string }> = [];
    for (const p of Object.values(personsById)) {
      for (const sid of p.spouseIds ?? []) {
        const key = [p.id, sid].sort().join("-");
        if (set.has(key)) continue;
        set.add(key);
        list.push({ a: p.id, b: sid });
      }
    }
    return list;
  }, [personsById]);

  return (
    <View style={{ flex: 1, minHeight: 2000, minWidth: 2000 }}>
      <Svg
        width={2000}
        height={2000}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
        }}
        pointerEvents="none"
      >
        {parentEdges.map(({ from, to }) => (
          <ParentEdge
            key={`parent-${from}-${to}`}
            from={from}
            to={to}
            getRealPosition={getRealPosition}
            positions={positions}
            color={theme.parentLink}
          />
        ))}
        {spouseEdges.map(({ a, b }) => (
          <SpouseEdge
            key={`spouse-${a}-${b}`}
            a={a}
            b={b}
            getRealPosition={getRealPosition}
            color={theme.spouseLink}
          />
        ))}
      </Svg>

      {nodes.map((id) => (
        <AbsoluteNode
          key={id}
          id={id}
          onDragOffset={(offset) => handleDragOffset(id, offset)}
        />
      ))}
    </View>
  );
};

const AbsoluteNode: React.FC<{
  id: string;
  onDragOffset: (offset: { x: number; y: number }) => void;
}> = React.memo(({ id, onDragOffset }) => {
  const { t } = useTranslation();
  const { personsById, positions, setNodePosition, removePerson } =
    useTreeStore();
  const { setIsDragging } = useDragCtx();
  const { currentTheme } = useSettings();
  const theme = currentTheme === "dark" ? colors.dark : colors.light;
  const person = personsById[id];
  const storePos = positions[id] ?? { x: 0, y: 0 };

  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [selected, setSelected] = useState(false);
  const [editing, setEditing] = useState(false);

  // Используем ref для хранения текущей позиции из стора
  const storePosRef = useRef(storePos);
  storePosRef.current = storePos;

  const dragStart = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_evt, gesture) => {
        // Начинаем драг только если сдвинулись больше чем на 5px
        return Math.abs(gesture.dx) + Math.abs(gesture.dy) > 5;
      },
      onPanResponderGrant: (_evt, _gesture) => {
        isDraggingRef.current = true;
        dragStart.current = {
          x: storePosRef.current.x,
          y: storePosRef.current.y,
        };
        setIsDragging(true);
      },
      onPanResponderMove: (_evt, gesture) => {
        setOffsetX(gesture.dx);
        setOffsetY(gesture.dy);
        onDragOffset({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (_evt, gesture) => {
        if (isDraggingRef.current) {
          const newX = dragStart.current.x + gesture.dx;
          const newY = dragStart.current.y + gesture.dy;
          setNodePosition(id, newX, newY);
          setOffsetX(0);
          setOffsetY(0);
          isDraggingRef.current = false;
          setIsDragging(false);
          // Сбрасываем офсет
          onDragOffset({ x: 0, y: 0 });
        }
      },
      onPanResponderTerminate: (_evt, gesture) => {
        if (isDraggingRef.current) {
          const newX = dragStart.current.x + gesture.dx;
          const newY = dragStart.current.y + gesture.dy;
          setNodePosition(id, newX, newY);
          setOffsetX(0);
          setOffsetY(0);
          isDraggingRef.current = false;
          setIsDragging(false);
          // Сбрасываем офсет
          onDragOffset({ x: 0, y: 0 });
        }
      },
    }),
  ).current;

  const handlePress = () => {
    // Открываем модал только если не было перетаскивания
    if (!isDraggingRef.current) {
      setSelected(true);
    }
  };

  return (
    <View
      style={{
        position: "absolute",
        left: storePos.x + offsetX,
        top: storePos.y + offsetY,
      }}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...pan.panHandlers}
    >
      <NodeCard person={person} onPress={handlePress} />
      <Modal
        visible={selected}
        transparent
        animationType="fade"
        onRequestClose={() => setSelected(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.45)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{
              backgroundColor: theme.surface,
              borderRadius: 10,
              width: "92%",
              maxHeight: "85%",
            }}
          >
            <ScrollView style={{ padding: 16 }}>
              <View style={{ alignItems: "center", marginBottom: 16 }}>
                {person.photoUri ? (
                  <Image
                    source={{ uri: person.photoUri }}
                    style={{ width: 120, height: 120, borderRadius: 60 }}
                  />
                ) : (
                  <View
                    style={{
                      width: 120,
                      height: 120,
                      borderRadius: 60,
                      backgroundColor: theme.avatarBg,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons
                      name="person"
                      size={60}
                      color={theme.avatarIcon}
                    />
                  </View>
                )}
              </View>

              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "700",
                  textAlign: "center",
                  marginBottom: 8,
                  color: theme.primary,
                }}
              >
                {[person.firstName, person.lastName]
                  .filter(Boolean)
                  .join(" ") || person.name}
              </Text>

              {person.birthDateISO || person.deathDateISO ? (
                <View
                  style={{
                    backgroundColor: theme.surfaceVariant,
                    padding: 12,
                    borderRadius: 8,
                    marginBottom: 12,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: theme.secondary,
                      marginBottom: 4,
                    }}
                  >
                    {t("life_dates")}
                  </Text>
                  {person.birthDateISO && (
                    <Text style={{ fontSize: 14, color: theme.primary }}>
                      {t("born")}: {person.birthDateISO}
                    </Text>
                  )}
                  {person.deathDateISO && (
                    <Text style={{ fontSize: 14, color: theme.primary }}>
                      {t("died")}: {person.deathDateISO}
                    </Text>
                  )}
                </View>
              ) : null}

              {person.parentIds && person.parentIds.length > 0 && (
                <View
                  style={{
                    backgroundColor: theme.surfaceVariant,
                    padding: 12,
                    borderRadius: 8,
                    marginBottom: 12,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: theme.secondary,
                      marginBottom: 4,
                    }}
                  >
                    {t("parents_label")}
                  </Text>
                  {person.parentIds.map((parentId) => {
                    const parent = personsById[parentId];
                    if (!parent) return null;
                    return (
                      <Text
                        key={parentId}
                        style={{ fontSize: 14, color: theme.primary }}
                      >
                        {[parent.firstName, parent.lastName]
                          .filter(Boolean)
                          .join(" ") || parent.name}
                      </Text>
                    );
                  })}
                </View>
              )}

              {person.spouseIds && person.spouseIds.length > 0 && (
                <View
                  style={{
                    backgroundColor: theme.surfaceVariant,
                    padding: 12,
                    borderRadius: 8,
                    marginBottom: 12,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: theme.secondary,
                      marginBottom: 4,
                    }}
                  >
                    {t("spouse_label")}
                  </Text>
                  {person.spouseIds.map((spouseId) => {
                    const spouse = personsById[spouseId];
                    if (!spouse) return null;
                    return (
                      <Text
                        key={spouseId}
                        style={{ fontSize: 14, color: theme.primary }}
                      >
                        {[spouse.firstName, spouse.lastName]
                          .filter(Boolean)
                          .join(" ") || spouse.name}
                      </Text>
                    );
                  })}
                </View>
              )}

              {person.comment ? (
                <View
                  style={{
                    backgroundColor: theme.surfaceVariant,
                    padding: 12,
                    borderRadius: 8,
                    marginBottom: 12,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: theme.secondary,
                      marginBottom: 4,
                    }}
                  >
                    {t("comment_label")}
                  </Text>
                  <Text style={{ fontSize: 14, color: theme.primary }}>
                    {person.comment}
                  </Text>
                </View>
              ) : null}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginTop: 4,
                  gap: 8,
                }}
              >
                <Pressable
                  onPress={() => {
                    Alert.alert(
                      t("delete_confirm_title"),
                      t("delete_confirm_message", { name: person.firstName }),
                      [
                        { text: t("cancel"), style: "cancel" },
                        {
                          text: t("delete_label"),
                          style: "destructive",
                          onPress: () => {
                            removePerson(id);
                            setSelected(false);
                          },
                        },
                      ],
                    );
                  }}
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    backgroundColor: theme.error,
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ color: "white", fontWeight: "600" }}>
                    {t("delete_label")}
                  </Text>
                </Pressable>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <Pressable
                    onPress={() => setSelected(false)}
                    style={{
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                      backgroundColor: theme.surfaceVariant,
                      borderRadius: 8,
                    }}
                  >
                    <Text style={{ fontWeight: "600", color: theme.primary }}>
                      {t("close_label")}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      setSelected(false);
                      setEditing(true);
                    }}
                    style={{
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                      backgroundColor: theme.accent,
                      borderRadius: 8,
                    }}
                  >
                    <Text style={{ color: "white", fontWeight: "600" }}>
                      {t("edit_label")}
                    </Text>
                  </Pressable>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
      <AddPersonModal
        visible={editing}
        onClose={() => setEditing(false)}
        editPerson={person}
      />
    </View>
  );
});

AbsoluteNode.displayName = "AbsoluteNode";
