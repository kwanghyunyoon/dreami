import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import HomeScreen from './src/screens/HomeScreen';
import SoundsScreen from './src/screens/SoundsScreen';
import LogScreen from './src/screens/LogScreen';
import AlarmScreen from './src/screens/AlarmScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import LanguagePicker from './src/components/LanguagePicker';
import { colors, shadow } from './src/theme';
import { LanguageProvider, useLanguage } from './src/LanguageContext';
import * as storage from './src/utils/storage';

const Tab = createBottomTabNavigator();

function TabBar({ state, descriptors, navigation }) {
  const { t } = useLanguage();

  return (
    <View style={tabStyles.container}>
      <View style={tabStyles.bar}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;

          const iconMap = {
            Home: focused ? 'moon' : 'moon-outline',
            Sounds: focused ? 'musical-notes' : 'musical-notes-outline',
            Log: focused ? 'bar-chart' : 'bar-chart-outline',
            Alarm: focused ? 'alarm' : 'alarm-outline',
            Settings: focused ? 'settings' : 'settings-outline',
          };

          const labelMap = {
            Home: t.tabs.home,
            Sounds: t.tabs.sounds,
            Log: t.tabs.log,
            Alarm: t.tabs.alarm,
            Settings: t.tabs.settings,
          };

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
          };

          return (
            <TouchableOpacity
              key={route.key}
              style={tabStyles.tab}
              onPress={onPress}
              activeOpacity={0.7}
            >
              <View style={[tabStyles.iconWrap, focused && tabStyles.iconWrapActive]}>
                <Ionicons
                  name={iconMap[route.name]}
                  size={22}
                  color={focused ? colors.white : colors.subtext}
                />
              </View>
              <Text style={[tabStyles.label, focused && tabStyles.labelActive]}>
                {labelMap[route.name]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const tabStyles = StyleSheet.create({
  container: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
  },
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 8,
    ...shadow.soft,
    shadowOpacity: 0.12,
  },
  tab: { flex: 1, alignItems: 'center', gap: 4 },
  iconWrap: { width: 44, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  iconWrapActive: { backgroundColor: colors.primary },
  label: { fontSize: 11, color: colors.subtext, fontWeight: '500' },
  labelActive: { color: colors.primary, fontWeight: '700' },
});

function LangButton() {
  const { lang, languages } = useLanguage();
  const [showPicker, setShowPicker] = useState(false);

  const current = languages.find((l) => l.code === lang) || languages[0];

  return (
    <>
      <TouchableOpacity
        onPress={() => setShowPicker(true)}
        style={langStyles.btn}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={langStyles.label}>{current.flag} {current.nativeName}</Text>
      </TouchableOpacity>
      <LanguagePicker visible={showPicker} onClose={() => setShowPicker(false)} />
    </>
  );
}

const langStyles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: { fontSize: 13, fontWeight: '600', color: colors.text },
});

function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        tabBar={(props) => <TabBar {...props} />}
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.background,
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 0,
          },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '700', fontSize: 18 },
          headerTitle: '',
          headerRight: () => <LangButton />,
        }}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Sounds" component={SoundsScreen} />
        <Tab.Screen name="Log" component={LogScreen} />
        <Tab.Screen name="Alarm" component={AlarmScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

function AppWithOnboarding() {
  const [state, setState] = useState({ onboardingDone: false, checking: true });

  useEffect(() => {
    storage.getItem('onboarding').then((value) => {
      setState({ onboardingDone: value != null, checking: false });
    });
  }, []);

  if (state.checking) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  if (!state.onboardingDone) {
    return (
      <OnboardingScreen
        onComplete={() => setState({ onboardingDone: true, checking: false })}
      />
    );
  }

  return <AppNavigator />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <LanguageProvider>
        <AppWithOnboarding />
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
