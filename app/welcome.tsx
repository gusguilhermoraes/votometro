import React, { useEffect } from 'react';
import { StyleSheet, Image, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import useAuth from '@/hooks/useAuth';
import { useTheme } from '@/context/ThemeContext';

const LogoLight = require("../assets/images/logo-votometro.png");
const LogoDark = require("../assets/images/logo-votometro-dark.png");

export default function Welcome() {
  const router = useRouter();
  const { user } = useAuth();

  const { tema, coresAtuais } = useTheme();
  const isDarkMode = tema === 'escuro';

  useEffect(() => {
    if (user) {
      router.replace('/home');
    }
  }, [user]);

  const acessarLogin = () => {
    router.push('/login');
  };

  const acessarCadastro = () => {
    router.push('/cadastro');
  };

  const acessarConvidado = () => {
    router.push('/home');
  };

  return (
    <SafeAreaView style={[stylesinicio.container, { backgroundColor: coresAtuais.primariaVerde }]}>
      <Image
        source={isDarkMode ? LogoDark : LogoLight}
        style={{ width: '95%', height: '50%' }}
        resizeMode="contain"
      />
      <Button
        onPress={acessarLogin}
        labelStyle={{ fontSize: 18, fontFamily: 'Urbanist_600SemiBold' }}
        style={[stylesinicio.buttonlogin, { backgroundColor: coresAtuais.buttonLogin, borderColor: coresAtuais.buttonLoginBorder}]}
        textColor={isDarkMode ? "#000000" : "#ffffff"}
      >
        Entrar
      </Button>
      <Button
        onPress={acessarCadastro}
        labelStyle={{ fontSize: 18, fontFamily: 'Urbanist_600SemiBold' }}
        style={[stylesinicio.buttoncadastro, { borderColor: coresAtuais.buttonLoginBorder }]}
        textColor="#000000"
      >
        Cadastrar
      </Button>
      <Text
        style={stylesinicio.convidado}
        onPress={acessarConvidado}
      >
        Continuar como convidado
      </Text>
    </SafeAreaView>
  );
}

const stylesinicio = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  buttonlogin: {
    margin: 4,
    width: '90%',
    height: '7%',
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
  },
  buttoncadastro: {
    margin: 4,
    marginTop: 10,
    marginBottom: 50,
    width: '90%',
    height: '7%',
    borderRadius: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    justifyContent: 'center',
  },
  convidado: {
    textDecorationLine: 'underline',
    fontSize: 15,
    fontFamily: 'Urbanist_700Bold',
    color: '#ffffff'
  },
});
