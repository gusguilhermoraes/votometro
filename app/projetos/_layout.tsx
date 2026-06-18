import { Stack } from "expo-router";
import React from "react";
import { useTheme } from "@/context/ThemeContext";

export default function RootLayout() {
  const { coresAtuais } = useTheme();

  return (
    <Stack>
      <Stack.Screen
        name="pesquisaProjeto"
        options={{
          title: 'Pesquisa de Projetos',
          headerStyle: {
            backgroundColor: coresAtuais.primariaVerde,
          },
          headerTintColor: "#ffffff",
          headerTitleAlign: "center",
        }}
      />
      <Stack.Screen
        name="resultados"
        options={{
          title: 'Resultados',
          headerStyle: {
            backgroundColor: coresAtuais.primariaVerde,
          },
          headerTintColor: "#ffffff",
          headerTitleAlign: "center",
        }}
      />
    </Stack>
  );
}
