import { Stack } from "expo-router";
import React from "react";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="favoritos"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="exportarFavoritos"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="perfil"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
