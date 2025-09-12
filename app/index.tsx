import React, {
  useState,
  useEffect,
  useContext,
  createContext,
} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

// Using env import for expo
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

if (!BACKEND_URL) {
  console.warn('⚠️ BACKEND_URL is not set. Check .env file!');
}

// -----------------------
// 🔐 Auth Context
// -----------------------
interface Employee {
  id: string;
  employee_id: string;
  name: string;
  email: string;
  department: string;
  contact_phone: string;
  is_active: boolean;
  created_at: string;
  performance_stats: {
    total_complaints_resolved: number;
    total_complaints_assigned: number;
    resolution_rate: number;
    last_activity: string;
  };
}

interface AuthContextType {
  employee: Employee | null;
  token: string | null;
  login: (employeeId: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);

// -----------------------
// 🧠 Auth Provider
// -----------------------
const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('auth_token');
      const storedEmployee = await AsyncStorage.getItem('employee_data');

      if (storedToken && storedEmployee) {
        setToken(storedToken);
        setEmployee(JSON.parse(storedEmployee));
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (
    employeeId: string,
    password: string
  ): Promise<boolean> => {
    if (!BACKEND_URL) {
      Alert.alert('Error', 'Backend URL is not configured.');
      return false;
    }

    try {
      setIsLoading(true);
      console.log('➡️ Sending login to:', `${BACKEND_URL}/api/auth/login`);
      console.log('Request body:', { employee_id: employeeId, password });

      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employee_id: employeeId,
          password: password,
        }),
      });

      console.log('⬅️ Received response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Login successful:', data);

        setToken(data.access_token);
        setEmployee(data.employee);

        await AsyncStorage.setItem('auth_token', data.access_token);
        await AsyncStorage.setItem(
          'employee_data',
          JSON.stringify(data.employee)
        );

        router.replace('/(tabs)/home');
        return true;
      } else {
        const errorData = await response.json();
        console.warn('Login failed response:', errorData);
        Alert.alert(
          'Login Failed',
          errorData.detail || 'Invalid credentials'
        );
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Failed to connect to server');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('employee_data');
      setToken(null);
      setEmployee(null);
      router.replace('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{ employee, token, login, logout, isLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// -----------------------
// 👤 Login Screen
// -----------------------
const LoginScreen: React.FC = () => {
  const [employeeId, setEmployeeId] = useState('test123');
  const [password, setPassword] = useState('test123');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const auth = useContext(AuthContext);

  const handleLogin = async () => {
    if (!employeeId.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both Employee ID and Password');
      return;
    }

    setIsLoading(true);
    const success = await auth?.login(employeeId.trim(), password);
    setIsLoading(false);

    if (!success) {
      setPassword(''); // Reset password if login fails
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a365d" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.loginContainer}>
            <View style={styles.header}>
              <Ionicons
                name="shield-checkmark"
                size={60}
                color="#4299e1"
              />
              <Text style={styles.title}>Municipality Portal</Text>
              <Text style={styles.subtitle}>Employee Login</Text>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color="#4a5568"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Employee ID"
                  placeholderTextColor="#a0aec0"
                  value={employeeId}
                  onChangeText={setEmployeeId}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color="#4a5568"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Password"
                  placeholderTextColor="#a0aec0"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color="#4a5568"
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                onPress={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <>
                    <Text style={styles.loginButtonText}>Sign In</Text>
                    <Ionicons
                      name="arrow-forward"
                      size={20}
                      color="#ffffff"
                    />
                  </>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Contact your municipal office for login credentials
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// -----------------------
// 🚀 Main App Component
// -----------------------
function AppContent() {
  const auth = useContext(AuthContext);

  useEffect(() => {
    if (!auth?.isLoading && auth?.employee) {
      router.replace('/(tabs)/home');
    }
  }, [auth?.isLoading, auth?.employee]);

  if (auth?.isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4299e1" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return <LoginScreen />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a202c',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#a0aec0',
    marginTop: 8,
    textAlign: 'center',
  },
  formContainer: {
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2d3748',
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
  },
  eyeIcon: {
    marginLeft: 8,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3182ce',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  loginButtonDisabled: {
    backgroundColor: '#63b3ed',
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    marginRight: 8,
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 24,
    alignItems: 'center',
  },
  footerText: {
    color: '#a0aec0',
    fontSize: 14,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a202c',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#a0aec0',
  },
});
