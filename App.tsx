import React, { useState } from 'react';
import { StatusBar, View, Pressable, Text } from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { StoreProvider } from './src/app/providers/StoreProvider';
import { SettingsProvider, useSettings } from './src/app/providers/SettingsProvider';
import { HomeScreen } from './src/pages/home/ui/HomeScreen';
import { SettingsScreen } from './src/pages/settings/ui/SettingsScreen';
import './src/shared/config/i18n';
import { Ionicons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { colors } from './src/shared/config/theme/colors';

export default function App() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SettingsProvider>
          <StoreProvider>
            <Shell />
          </StoreProvider>
        </SettingsProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

const Shell: React.FC = () => {
  const [tab, setTab] = useState<'home' | 'settings'>('home');
  const { currentTheme } = useSettings();
  const theme = currentTheme === 'dark' ? colors.dark : colors.light;
  const isDark = currentTheme === 'dark';
  
  return (
    <>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['top']}>
        <View style={{ flex: 1 }}>
          {tab === 'home' ? <HomeScreen /> : <SettingsScreen />}
        </View>
        <View style={{ 
          flexDirection: 'row', 
          paddingHorizontal: 12, 
          paddingVertical: 8, 
          borderTopWidth: 1, 
          borderTopColor: theme.border, 
          backgroundColor: theme.surface 
        }}>
          <TabButton 
            icon="home-outline" 
            label="Home" 
            active={tab === 'home'} 
            onPress={() => setTab('home')} 
            activeColor={theme.accent}
            inactiveColor={theme.tertiary}
          />
          <TabButton 
            icon="settings-outline" 
            label="Settings" 
            active={tab === 'settings'} 
            onPress={() => setTab('settings')} 
            activeColor={theme.accent}
            inactiveColor={theme.tertiary}
          />
        </View>
      </SafeAreaView>
    </>
  );
};

const TabButton: React.FC<{ 
  icon: keyof typeof Ionicons.glyphMap; 
  label: string; 
  active?: boolean; 
  onPress: () => void;
  activeColor: string;
  inactiveColor: string;
}> = ({ icon, label, active, onPress, activeColor, inactiveColor }) => (
  <Pressable onPress={onPress} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
    <Ionicons name={icon} size={22} color={active ? activeColor : inactiveColor} />
    <Text style={{ color: active ? activeColor : inactiveColor, fontSize: 12 }}>{label}</Text>
  </Pressable>
);
