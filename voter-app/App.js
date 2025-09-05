import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import React, { useMemo, useState, useEffect, useCallback, createContext, useContext } from 'react';
import { StyleSheet, Text, View, Button } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { VictoryBar, VictoryChart, VictoryTheme } from 'victory-native';
import { CameraView, Camera } from 'expo-camera';

const AuthContext = createContext(null);

function useAuth() {
  return useContext(AuthContext);
}

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [hasVotedDate, setHasVotedDate] = useState(null);

  const login = useCallback((email, password) => {
    setUser({ id: 'demo-user', email });
    setHasVotedDate('2024-05-20');
  }, []);

  const signup = useCallback((email, password) => {
    setUser({ id: 'demo-user', email });
    setHasVotedDate(null);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setHasVotedDate(null);
  }, []);

  const value = useMemo(() => ({ user, login, signup, logout, hasVotedDate }), [user, login, signup, logout, hasVotedDate]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

function LoginScreen({ navigation }) {
  const { login } = useAuth();
  return (
    <View style={styles.centered}>
      <Text style={styles.title}>Login</Text>
      <Button title="Login (demo)" onPress={() => login('demo@user.com', 'password')} />
      <View style={{ height: 12 }} />
      <Button title="Go to Signup" onPress={() => navigation.navigate('Signup')} />
    </View>
  );
}

function SignupScreen({ navigation }) {
  const { signup } = useAuth();
  return (
    <View style={styles.centered}>
      <Text style={styles.title}>Signup</Text>
      <Button title="Create Account (demo)" onPress={() => signup('new@user.com', 'password')} />
      <View style={{ height: 12 }} />
      <Button title="Back to Login" onPress={() => navigation.goBack()} />
    </View>
  );
}

function DashboardScreen() {
  const { hasVotedDate, logout } = useAuth();
  return (
    <View style={styles.centered}>
      <Text style={styles.title}>Dashboard</Text>
      {hasVotedDate ? (
        <Text>You voted on: {hasVotedDate}</Text>
      ) : (
        <Text>You have not voted yet.</Text>
      )}
      <View style={{ height: 12 }} />
      <Button title="Logout" onPress={logout} />
    </View>
  );
}

function AnalyticsScreen() {
  const currentYear = new Date().getFullYear();
  const data = Array.from({ length: 5 }).map((_, idx) => ({
    year: currentYear - idx,
    votes: 40 + Math.round(Math.random() * 60),
  })).reverse();
  return (
    <View style={styles.centered}>
      <Text style={styles.title}>Analytics (last 5 years)</Text>
      <VictoryChart theme={VictoryTheme.material} domainPadding={20}>
        <VictoryBar data={data} x="year" y="votes" />
      </VictoryChart>
    </View>
  );
}

function ScanCenterScreen({ navigation }) {
  return (
    <View style={styles.centered}>
      <Text style={styles.title}>Scan Center</Text>
      <Button title="Scan Center" onPress={() => navigation.navigate('QRScanner')} />
    </View>
  );
}

function QRScannerScreen() {
  const [permission, requestPermission] = Camera.useCameraPermissions();
  const [scannedData, setScannedData] = useState(null);

  useEffect(() => {
    if (!permission || !permission.granted) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  if (!permission) {
    return <View style={styles.centered}><Text>Requesting camera permission...</Text></View>;
  }
  if (!permission.granted) {
    return <View style={styles.centered}><Text>No access to camera</Text></View>;
  }

  return (
    <View style={{ flex: 1 }}>
      <CameraView
        style={{ flex: 1 }}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        onBarcodeScanned={scannedData ? undefined : (result) => {
          if (result && result.data) setScannedData(result.data);
        }}
      />
      <View style={{ padding: 16 }}>
        <Text>Scanned: {scannedData || '—'}</Text>
        {scannedData ? <Button title="Scan Again" onPress={() => setScannedData(null)} /> : null}
      </View>
    </View>
  );
}

function AuthedTabs() {
  return (
    <Tabs.Navigator>
      <Tabs.Screen name="Dashboard" component={DashboardScreen} />
      <Tabs.Screen name="Analytics" component={AnalyticsScreen} />
      <Tabs.Screen name="Scan" component={ScanCenterScreen} />
    </Tabs.Navigator>
  );
}

function RootNavigator() {
  const { user } = useAuth();
  return (
    <Stack.Navigator>
      {user ? (
        <>
          <Stack.Screen name="Home" component={AuthedTabs} options={{ headerShown: false }} />
          <Stack.Screen name="QRScanner" component={QRScannerScreen} options={{ title: 'QR Code Scanner' }} />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <RootNavigator />
          <StatusBar style="auto" />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  title: { fontSize: 22, fontWeight: '600', marginBottom: 12 },
});
