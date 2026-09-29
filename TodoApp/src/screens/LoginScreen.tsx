import React, { useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import InputField from '../components/InputField';
import AppButton from '../components/AppButton';
import { useAuth } from '../context/AuthContext';
import { validateEmail, validatePassword } from '../utils/validation';
import { getErrorMessage } from '../utils/errors';
import { colors } from '../theme';

export default function LoginScreen({ onGoToRegister }: { onGoToRegister: () => void }) {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string | null; password?: string | null }>({});
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    // 1. Validate on the phone first
    const newErrors = { email: validateEmail(email), password: validatePassword(password) };
    setErrors(newErrors);
    if (newErrors.email || newErrors.password) return;

    // 2. Call the API
    setLoading(true);
    try {
      await login(email, password); // on success, App.tsx switches to the Home screen
    } catch (err) {
      const message = getErrorMessage(err);
      if (/email/i.test(message) && !/password/i.test(message)) {
        setErrors((prev) => ({ ...prev, email: message }));
      } else {
        Alert.alert('Login failed', message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled">
        <Image source={require('../assets/todo-app-logo.png')} style={styles.logo} />
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Log in to manage your tasks</Text>

        <InputField
          label="Email"
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          error={errors.email}
        />
        <InputField
          label="Password"
          placeholder="Your password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          error={errors.password}
        />

        <AppButton title="Log In" onPress={handleLogin} loading={loading} style={{ marginTop: 8 }} />

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={onGoToRegister}>
            <Text style={styles.link}>Register</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logo: { width: 96, height: 96, alignSelf: 'center', marginBottom: 8 },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, textAlign: 'center' },
  subtitle: { fontSize: 14, color: colors.muted, textAlign: 'center', marginBottom: 28 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  footerText: { color: colors.muted },
  link: { color: colors.primary, fontWeight: '700' },
});
