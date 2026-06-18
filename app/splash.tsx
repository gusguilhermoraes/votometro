import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View, Image } from "react-native";
import { useTheme } from '@/context/ThemeContext';

const LogoLight = require("../assets/images/logo-splash.png");
const LogoDark = require("../assets/images/logo-splash-dark.png");

export default function Splashscreen() {
  const { tema, coresAtuais } = useTheme();
  const isDarkMode = tema === 'escuro';

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: coresAtuais.primariaVerde }]}>
      <Animated.Image
        source={isDarkMode ? LogoDark : LogoLight}
        style={[styles.image, { opacity: fadeAnim }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: 200,
    height: 200,
    resizeMode: "contain",
  },
});
