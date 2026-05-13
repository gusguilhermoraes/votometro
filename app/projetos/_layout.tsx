import { Stack } from "expo-router";
import React from "react";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="pesquisaProjeto"
        options={{
          title: 'Pesquisa de Projetos',
          headerStyle: {
            backgroundColor: "#009440",
          },
          headerTintColor: "black",
          headerTitleAlign: "center",
        }}
      />
      <Stack.Screen
        name="resultados"
        options={{
          title: 'Resultados',
          headerStyle: {
            backgroundColor: "#009440",
          },
          headerTintColor: "black",
          headerTitleAlign: "center",
        }}
      />
    </Stack>
  );
}
