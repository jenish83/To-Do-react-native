import React, { useState } from 'react';
import { ActivityIndicator, StatusBar, View } from 'react-native';
import { initialWindowMetrics, SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { TaskProvider } from './src/context/TaskContext';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import { colors } from './src/theme';

// Decides which screen to show:
//  - still checking saved login -> spinner
//  - logged in                  -> Home
//  - logged out                 -> Login or Register
function Root() {
  const { user, loading } = useAuth();
  const [showRegister, setShowRegister] = useState(false);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.background }}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (user) return <HomeScreen />;

  return showRegister ? (
    <RegisterScreen onGoToLogin={() => setShowRegister(false)} />
  ) : (
    <LoginScreen onGoToRegister={() => setShowRegister(true)} />
  );
}

export default function App() {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <AuthProvider>
        <TaskProvider>
          <Root />
        </TaskProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
