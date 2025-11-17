import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Modal,
  View,
  Image,
  Pressable,
  StyleSheet,
  Dimensions,
  Platform,
  Text,
} from "react-native";

type ImageGalleryViewerProps = {
  visible: boolean;
  images: string[];
  initialIndex?: number;
  onClose: () => void;
};

export const ImageGalleryViewer: React.FC<ImageGalleryViewerProps> = ({
  visible,
  images,
  initialIndex = 0,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  React.useEffect(() => {
    if (visible) {
      setCurrentIndex(initialIndex);
    }
  }, [visible, initialIndex]);

  if (!images || images.length === 0) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <Pressable style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={32} color="white" />
        </Pressable>

        <View style={styles.imageContainer}>
          <Image
            source={{ uri: images[currentIndex] }}
            style={{
              width: screenWidth,
              height: screenHeight,
            }}
            resizeMode="contain"
          />
        </View>

        {images.length > 1 && (
          <>
            <Pressable
              style={[styles.navButton, styles.navButtonLeft]}
              onPress={goToPrevious}
            >
              <Ionicons name="chevron-back" size={40} color="white" />
            </Pressable>

            <Pressable
              style={[styles.navButton, styles.navButtonRight]}
              onPress={goToNext}
            >
              <Ionicons name="chevron-forward" size={40} color="white" />
            </Pressable>

            <View style={styles.indicator}>
              <Ionicons name="images" size={20} color="white" />
              <Text style={styles.indicatorText}>
                {currentIndex + 1} / {images.length}
              </Text>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    top: Platform.OS === "web" ? 20 : 50,
    right: 20,
    zIndex: 10,
    padding: 10,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 20,
  },
  imageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  navButton: {
    position: "absolute",
    top: "50%",
    transform: [{ translateY: -20 }],
    padding: 15,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 30,
    zIndex: 10,
  },
  navButtonLeft: {
    left: 20,
  },
  navButtonRight: {
    right: 20,
  },
  indicator: {
    position: "absolute",
    bottom: 30,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  indicatorText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
