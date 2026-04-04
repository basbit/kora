import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  Text,
  Pressable,
  Image,
  ScrollView,
  Platform,
} from "react-native";

import { useImageData } from "@shared/lib/fs/images";

type Props = {
  photoUri: string | undefined;
  onPhotoChange: (uri: string | undefined) => void;
  galleryPhotos: string[];
  onGalleryChange: (photos: string[]) => void;
};

const btnGhost = {
  backgroundColor: "#eee",
  paddingVertical: 6,
  paddingHorizontal: 10,
  borderRadius: 8,
} as const;

export const PersonPhotoSection: React.FC<Props> = ({
  photoUri,
  onPhotoChange,
  galleryPhotos,
  onGalleryChange,
}) => {
  const { t } = useTranslation();
  const { imageData: photoData } = useImageData(photoUri);

  const pickPhoto = async () => {
    if (Platform.OS === "web") {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = (e: Event) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (ev) => onPhotoChange(ev.target?.result as string);
          reader.readAsDataURL(file);
        }
      };
      input.click();
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    });
    if (!res.canceled && res.assets?.[0]?.uri) onPhotoChange(res.assets[0].uri);
  };

  const pickGalleryPhotos = async () => {
    if (Platform.OS === "web") {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.multiple = true;
      input.onchange = (e: Event) => {
        const files = Array.from((e.target as HTMLInputElement).files || []);
        files.forEach((file) => {
          const reader = new FileReader();
          reader.onload = (ev) => {
            onGalleryChange([...galleryPhotos, ev.target?.result as string]);
          };
          reader.readAsDataURL(file);
        });
      };
      input.click();
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
      allowsMultipleSelection: true,
    });
    if (!res.canceled && res.assets) {
      onGalleryChange([...galleryPhotos, ...res.assets.map((a) => a.uri)]);
    }
  };

  return (
    <View style={{ gap: 12 }}>
      <View style={{ alignItems: "center" }}>
        <Pressable onPress={pickPhoto} style={{ alignItems: "center" }}>
          {photoData ? (
            <Image
              source={{ uri: photoData }}
              style={{ width: 96, height: 96, borderRadius: 48 }}
            />
          ) : (
            <View
              style={{
                width: 96,
                height: 96,
                borderRadius: 48,
                backgroundColor: "#e0e0e0",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="person" size={56} color="#5e35b1" />
            </View>
          )}
        </Pressable>
      </View>

      <View>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#555" }}>{t("photo_gallery")}</Text>
          <Pressable onPress={pickGalleryPhotos} style={btnGhost}>
            <View
              style={{ flexDirection: "row", gap: 4, alignItems: "center" }}
            >
              <Ionicons name="add" size={20} color="#5e35b1" />
              <Text style={{ color: "#5e35b1" }}>{t("add_photos")}</Text>
            </View>
          </Pressable>
        </View>

        {galleryPhotos.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ padding: 10 }}
          >
            {galleryPhotos.map((uri, index) => (
              <View key={index} style={{ position: "relative" }}>
                <Image
                  source={{ uri }}
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 8,
                    marginRight: 8,
                  }}
                />
                <Pressable
                  onPress={() =>
                    onGalleryChange(galleryPhotos.filter((_, i) => i !== index))
                  }
                  style={{
                    position: "absolute",
                    top: -8,
                    right: 0,
                    backgroundColor: "rgba(0,0,0,0.7)",
                    borderRadius: 12,
                    width: 24,
                    height: 24,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name="close" size={16} color="white" />
                </Pressable>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
};
