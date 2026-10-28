import type { ReactNode } from "react";
import { Platform, StyleSheet, View } from "react-native";

const MOBILE_MAX_WIDTH = 440;

// On web, flex:1 + overflow:hidden constrains the frame to viewport height so screen ScrollViews scroll internally (matches cw_cmp/cw_platf MobileFrame behavior).
export function MobileFrame({ children }: { children: ReactNode }) {
  if (Platform.OS !== "web") {
    return <>{children}</>;
  }
  return (
    <View style={styles.webPage}>
      <View style={styles.webFrame}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  webPage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
  },
  webFrame: {
    flex: 1,
    width: "100%",
    maxWidth: MOBILE_MAX_WIDTH,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    ...(Platform.OS === "web"
      ? {
          // @ts-ignore — RN Web supports box-shadow via style passthrough
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        }
      : {}),
  },
});
