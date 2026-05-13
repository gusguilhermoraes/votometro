import { Stack } from "expo-router";
import React from "react";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="pesquisaCandidato"
        options={{
          title: 'Pesquisa de Candidatos',
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
