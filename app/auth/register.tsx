import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, useColorScheme, ScrollView,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../lib/AuthContext';
import { Colors } from '../../lib/colors';
import { NexusLogo, BackIcon, EyeIcon, EyeOffIcon } from '../../components/icons';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await register(email.trim(), password, name.trim());
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <BackIcon size={24} color={theme.text} />
        </TouchableOpacity>

        <View style={styles.header}>
          <NexusLogo size={56} />
          <Text style={[styles.title, { color: theme.text }]}>Join Nexus</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Create your account</Text>
        </View>

        <View style={styles.form}>
          {[
            { label: 'Full Name', value: name, setter: setName, keyboard: 'default', capitalize: 'words' },
            { label: 'Email', value: email, setter: setEmail, keyboard: 'email-address', capitalize: 'none' },
          ].map((field) => (
            <View key={field.label} style={[styles.inputContainer, { backgroundColor: theme.input, borderColor: theme.border }]}>
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder={field.label}
                placeholderTextColor={theme.textSecondary}
                value={field.value}
                onChangeText={field.setter}
                keyboardType={field.keyboard as any}
                autoCapitalize={field.capitalize as any}
              />
            </View>
          ))}

          <View style={[styles.inputContainer, { backgroundColor: theme.input, borderColor: theme.border }]}>
            <TextInput
              style={[styles.input, { color: theme.text, flex: 1 }]}
              placeholder="Password"
              placeholderTextColor={theme.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOffIcon size={20} color={theme.textSecondary} /> : <EyeIcon size={20} color={theme.textSecondary} />}
            </TouchableOpacity>
          </View>

          <View style={[styles.inputContainer, { backgroundColor: theme.input, borderColor: theme.border }]}>
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Confirm Password"
              placeholderTextColor={theme.textSecondary}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
            />
          </View>

          <TouchableOpacity
            style={[styles.registerBtn, loading && styles.disabledBtn]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.registerBtnText}>{loading ? 'Creating Account...' : 'Create Account'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginLink} onPress={() => router.back()}>
            <Text style={[styles.loginLinkText, { color: theme.textSecondary }]}>
              Already have an account? <Text style={{ color: Colors.primary, fontWeight: '700' }}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, paddingTop: 60 },
  backBtn: { marginBottom: 24 },
  header: { alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 30, fontWeight: '800', marginTop: 12 },
  subtitle: { fontSize: 16, marginTop: 6 },
  form: { gap: 14 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, borderWidth: 1,
    paddingHorizontal: 16, height: 54,
  },
  input: { flex: 1, fontSize: 16 },
  registerBtn: {
    backgroundColor: Colors.primary, borderRadius: 14,
    height: 54, alignItems: 'center', justifyContent: 'center', marginTop: 8,
  },
  disabledBtn: { opacity: 0.7 },
  registerBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  loginLink: { alignItems: 'center', marginTop: 8 },
  loginLinkText: { fontSize: 15 },
});
