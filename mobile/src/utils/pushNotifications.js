import { Platform } from "react-native";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false
  })
});

const getProjectId = () => {
  return Constants?.expoConfig?.extra?.eas?.projectId || Constants?.easConfig?.projectId || null;
};

export const getDevicePushToken = async () => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const permission = await Notifications.requestPermissionsAsync();
    finalStatus = permission.status;
  }

  if (finalStatus !== "granted") {
    return null;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 200, 150, 200],
      lightColor: "#06b6d4"
    });
  }

  const projectId = getProjectId();
  if (!projectId) {
    return null;
  }

  const tokenResult = await Notifications.getExpoPushTokenAsync({ projectId });
  return tokenResult?.data || null;
};
