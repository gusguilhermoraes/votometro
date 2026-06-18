import { Stack } from "expo-router";
import React from "react";
import { ThemeProvider } from "@/context/ThemeContext";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <Stack>
        {/* Tela principal inicial */}
        <Stack.Screen
          name="index"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="splash"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="welcome"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="login"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="cadastro"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="cadastro-social"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="home"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="candidatos"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="politicos"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="projetos"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="paginas"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
    </ThemeProvider>
  );
}
