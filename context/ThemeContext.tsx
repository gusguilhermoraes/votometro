import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { cores } from '@/constants/colors';

// Chave padrão para salvar o tema no dispositivo
const ASYNC_STORAGE_THEME_KEY = '@votometro:theme';

interface ThemeContextType {
  tema: 'claro' | 'escuro';
  coresAtuais: typeof cores['claro'];
  mudarTema: (novoTema: 'claro' | 'escuro') => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [tema, setTema] = useState<'claro' | 'escuro'>('claro');

  // Carrega o tema salvo localmente assim que o app inicia
  useEffect(() => {
    const carregarTemaLocal = async () => {
      try {
        const temaSalvo = await AsyncStorage.getItem(ASYNC_STORAGE_THEME_KEY);
        if (temaSalvo === 'claro' || temaSalvo === 'escuro') {
          setTema(temaSalvo);
        }
      } catch (error) {
        console.error("Erro ao carregar o tema local:", error);
      }
    };

    carregarTemaLocal();
  }, []);

  // Altera o estado global e persiste no AsyncStorage
  const mudarTema = async (novoTema: 'claro' | 'escuro') => {
    setTema(novoTema);
    try {
      await AsyncStorage.setItem(ASYNC_STORAGE_THEME_KEY, novoTema);
    } catch (error) {
      console.error("Erro ao salvar o tema localmente:", error);
    }
  };

  const coresAtuais = cores[tema];

  return (
    <ThemeContext.Provider value={{ tema, coresAtuais, mudarTema }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider');
  }
  return context;
}