import React, { useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import InputField from '../components/InputField';
import AppButton from '../components/AppButton';
import { useAuth } from '../context/AuthContext';
import { validateEmail, validatePassword } from '../utils/validation';
import { getErrorMessage } from '../utils/errors';
import { colors } from '../theme';

export default function RegisterScreen({ onGoToLogin }: { onGoToLogin: () => void }) {
  const insets = useSafeAreaInsets();
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<{
    email?: string | null;
    password?: string | null;
    confirm?: string | null;
  }>({});
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    const newErrors = {
      email: validateEmail(email),
      password: validatePassword(password),
      confirm: confirm !== password ? 'Passwords do not match' : null,
    };
    setErrors(newErrors);
    if (newErrors.email || newErrors.password || newErrors.confirm) return;

    setLoading(true);
    try {
      await register(email, password); // registers and logs in straight away
    } catch (err) {
      const message = getErrorMessage(err);
      if (/email/i.test(message) && !/password/i.test(message)) {
        setErrors((prev) => ({ ...prev, email: message }));
      } else {
        Alert.alert('Registration failed', message);
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
        <Text style={styles.title}>Create account</Text>
        <Text style={styles.subtitle}>Sign up to start planning your tasks</Text>

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
          placeholder="At least 6 characters"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          error={errors.password}
        />
        <InputField
          label="Confirm password"
          placeholder="Repeat your password"
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
          error={errors.confirm}
        />

        <AppButton title="Register" onPress={handleRegister} loading={loading} style={{ marginTop: 8 }} />

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={onGoToLogin}>
            <Text style={styles.link}>Log in</Text>
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
