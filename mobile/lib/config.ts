import { Platform } from "react-native";

// 10.0.2.2 = host machine from Android *emulator* only (not Expo Go on a real phone)
const androidEmulatorHost = "http://10.0.2.2:3000";
const defaultDevHost = "http://localhost:3000";

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (Platform.OS === "android" ? androidEmulatorHost : defaultDevHost);