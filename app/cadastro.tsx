import { useRouter } from 'expo-router';
import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Alert, TextInput, KeyboardAvoidingView, Platform, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Button, Snackbar } from 'react-native-paper';
import { auth, db } from '../firebaseconfig';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Feather } from '@expo/vector-icons';
import RNPickerSelect from 'react-native-picker-select';
import { useTheme } from '@/context/ThemeContext';
import * as Haptics from 'expo-haptics';

export default function Cadastro() {
  const router = useRouter();

  const shakeAnimation = useRef(new Animated.Value(0)).current;
  
  // Controle de Etapas
  const [step, setStep] = useState(1);

  // Estados dos inputs - Passo 1 (Segurança)
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmSenha, setConfirmSenha] = useState('');

  // Estados dos inputs - Passo 2 (Perfil)
  const [sexo, setSexo] = useState('');
  const [anoNascimento, setAnoNascimento] = useState('');
  const [estado, setEstado] = useState('');

  // Controle de exibição das senhas
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [snackbarVisivel, setSnackbarVisivel] = useState(false);
  const [mensagemErro, setMensagemErro] = useState('');

  const { tema, coresAtuais } = useTheme();
  const isDarkMode = tema === 'escuro';

  // Gerar lista de anos dinamicamente (de 1920 até o ano atual)
  const anoAtual = new Date().getFullYear() - 15;
  const anosItens = Array.from({ length: anoAtual - 1900 + 1 }, (_, index) => {
    const ano = (anoAtual - index).toString();
    return { label: ano, value: ano };
  });

  // Lista de Estados (Exemplo com alguns estados, adicione os outros conforme necessário)
  const estadosItens = [
    { label: 'Acre - AC', value: 'AC' },
    { label: 'Alagoas - AL', value: 'AL' },
    { label: 'Amapá - AP', value: 'AP' },
    { label: 'Amazonas - AM', value: 'AM' },
    { label: 'Bahia - BA', value: 'BA' },
    { label: 'Ceará - CE', value: 'CE' },
    { label: 'Distrito Federal - DF', value: 'DF' },
    { label: 'Espírito Santo - ES', value: 'ES' },
    { label: 'Goiás - GO', value: 'GO' },
    { label: 'Maranhão - MA', value: 'MA' },
    { label: 'Mato Grosso - MT', value: 'MT' },
    { label: 'Mato Grosso do Sul - MS', value: 'MS' },
    { label: 'Minas Gerais - MG', value: 'MG' },
    { label: 'Pará - PA', value: 'PA' },
    { label: 'Paraíba - PB', value: 'PB' },
    { label: 'Paraná - PR', value: 'PR' },
    { label: 'Pernambuco - PE', value: 'PE' },
    { label: 'Piauí - PI', value: 'PI' },
    { label: 'Rio de Janeiro - RJ', value: 'RJ' },
    { label: 'Rio Grande do Norte - RN', value: 'RN' },
    { label: 'Rio Grande do Sul - RS', value: 'RS' },
    { label: 'Rondônia - RO', value: 'RO' },
    { label: 'Roraima - RR', value: 'RR' },
    { label: 'Santa Catarina - SC', value: 'SC' },
    { label: 'São Paulo - SP', value: 'SP' },
    { label: 'Sergipe - SE', value: 'SE' },
    { label: 'Tocantins - TO', value: 'TO' },
  ];

  const retornar = () => {
    if (step === 2) {
      setStep(1);
    } else {
      router.back();
    }
  };

  const logarSe = () => {
    router.replace('/login');
  };

  // Função que executa o "Chacoalhar" estilo Telegram
  const dispararShake = () => {
    // Sequência rápida de idas e voltas no eixo X
    Animated.sequence([
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const mostrarErro = (mensagem: string) => {
    setMensagemErro(mensagem);
    dispararShake();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    setSnackbarVisivel(true);
  };
  

  const handleAvancarEtapa = () => {
    if (!nome.trim() || !email.trim() || !senha.trim() || !confirmSenha.trim()) {
      mostrarErro('Preencha todos os campos para continuar.');
      return;
    }
    if (!email.includes('@')) {
      mostrarErro('Insira um e-mail válido.');
      return;
    }
    if (senha !== confirmSenha) {
      mostrarErro('As senhas não coincidem.'); 
      return;
    }
    if (senha.length < 6) {
      mostrarErro('A senha deve conter no mínimo 6 caracteres.'); 
      return;
    }

    setStep(2);
  };

  const handleCadastrar = async () => {
    if (!sexo || !anoNascimento || !estado) {
      mostrarErro('Por favor, selecione todas as informações do seu perfil.'); 
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, senha);

      await updateProfile(userCredential.user, {
        displayName: nome,
      });

      await setDoc(doc(db, 'usuarios', userCredential.user.uid), {
        username: nome,
        email: email,
        sexo: sexo,
        ano_nascimento: parseInt(anoNascimento, 10),
        estado_moradia: estado,
        data_criacao: new Date().toISOString(),
        tipo: 'comum',
      });

      Alert.alert('Sucesso', 'Cadastro realizado com sucesso!');
      router.replace('/login');
    } catch (error: any) {
      let mensagem = 'Erro no cadastro. Tente novamente.';
      if (error.code === 'auth/email-already-in-use') {
        mensagem = 'Este e-mail já está em uso.';
      } else if (error.code === 'auth/invalid-email') {
        mensagem = 'E-mail inválido.';
      } else if (error.code === 'auth/weak-password') {
        mensagem = 'Senha muito fraca.';
      }
      mostrarErro(mensagem);
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.container, { backgroundColor: coresAtuais.primariaVerde }]}>
        <KeyboardAvoidingView
          style={styles.inner}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Animated.ScrollView 
            contentContainerStyle={styles.scroll} 
            showsVerticalScrollIndicator={false}
            style={{ transform: [{ translateX: shakeAnimation }] }}
          >
            
            <TouchableOpacity style={styles.voltar} onPress={retornar}>
              <Feather name="arrow-left" size={22} color={isDarkMode ? "#000000" : "#009440"} />
            </TouchableOpacity>

            <View style={styles.cardLogin}>
              <View style={styles.header}>
                <Text style={styles.titulo}>Criar conta</Text>
                <Text style={styles.subtitulo}>
                  {step === 1 
                    ? "Passo 1 de 2: Credenciais de acesso" 
                    : "Passo 2 de 2: Informações do perfil"}
                </Text>
              </View>

              {/* INDICADOR VISUAL DE PROGRESSO */}
              <View style={styles.progressContainer}>
                <View style={styles.progressStepActive}>
                  <Text style={styles.progressTextActive}>1</Text>
                </View>
                <View style={[styles.progressLine, step === 2 && styles.progressLineActive]} />
                <View style={step === 2 ? styles.progressStepActive : styles.progressStep}>
                  <Text style={step === 2 ? styles.progressTextActive : styles.progressText}>2</Text>
                </View>
              </View>
              
              {/* ================= ETAPA 1: SEGURANÇA ================= */}
              {step === 1 && (
                <View style={styles.formCard}>
                  <TextInput
                    style={styles.input}
                    placeholder="Nome de usuário"
                    value={nome}
                    onChangeText={setNome}
                    placeholderTextColor="#888"
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="E-mail"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                    placeholderTextColor="#888"
                  />
                  
                  <View style={styles.inputSenhaContainer}>
                    <TextInput
                      style={styles.inputSenha}
                      placeholder="Senha"
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      value={senha}
                      onChangeText={setSenha}
                      placeholderTextColor="#888"
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                      <Feather name={showPassword ? "eye" : "eye-off"} size={20} color="#888" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.inputSenhaContainer}>
                    <TextInput
                      style={styles.inputSenha}
                      placeholder="Confirmar senha"
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                      value={confirmSenha}
                      onChangeText={setConfirmSenha}
                      placeholderTextColor="#888"
                    />
                    <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                      <Feather name={showConfirmPassword ? "eye" : "eye-off"} size={20} color="#888" />
                    </TouchableOpacity>
                  </View>

                  <Button
                    mode="contained"
                    onPress={handleAvancarEtapa}
                    style={styles.botaoRegistrar}
                    labelStyle={{ fontSize: 16, fontFamily: 'Urbanist_600SemiBold' }}
                  >
                    Continuar
                  </Button>
                </View>
              )}

              {/* ================= ETAPA 2: PERFIL (PICKERS) ================= */}
              {step === 2 && (
                <View style={styles.formCard}>
                  
                  {/* PICKER: SEXO */}
                  <View style={pickerStyles.pickerContainer}>
                    <RNPickerSelect
                      placeholder={{ label: 'Selecione seu gênero...', value: null, color: '#888' }}
                      value={sexo}
                      onValueChange={(value) => setSexo(value)}
                      items={[
                        { label: 'Masculino', value: 'Masculino' },
                        { label: 'Feminino', value: 'Feminino' },
                        { label: 'Outro / Não informar', value: 'Outro' },
                      ]}
                      style={pickerStyles}
                      useNativeAndroidPickerStyle={false}
                      Icon={() => <Feather name="chevron-down" size={20} color="#888" style={pickerStyles.icon} />}
                      pickerProps={{ mode: 'dropdown' }}
                    />
                  </View>

                  {/* PICKER: ANO DE NASCIMENTO */}
                  <View style={pickerStyles.pickerContainer}>
                    <RNPickerSelect
                      placeholder={{ label: 'Ano de nascimento...', value: null, color: '#888' }}
                      value={anoNascimento}
                      onValueChange={(value) => setAnoNascimento(value)}
                      items={anosItens}
                      style={pickerStyles}
                      useNativeAndroidPickerStyle={false}
                      Icon={() => <Feather name="chevron-down" size={20} color="#888" style={pickerStyles.icon} />}
                      pickerProps={{ mode: 'dropdown' }}
                    />
                  </View>

                  {/* PICKER: ESTADO DE MORADIA */}
                  <View style={pickerStyles.pickerContainer}>
                    <RNPickerSelect
                      placeholder={{ label: 'Estado onde vota...', value: null, color: '#888' }}
                      value={estado}
                      onValueChange={(value) => setEstado(value)}
                      items={estadosItens}
                      style={pickerStyles}
                      useNativeAndroidPickerStyle={false}
                      Icon={() => <Feather name="chevron-down" size={20} color="#888" style={pickerStyles.icon} />}
                      pickerProps={{ mode: 'dropdown' }}
                    />
                  </View>

                  <Button
                    mode="contained"
                    onPress={handleCadastrar}
                    style={styles.botaoRegistrar}
                    labelStyle={{ fontSize: 16, fontFamily: 'Urbanist_600SemiBold' }}
                  >
                    Registrar Conta
                  </Button>
                </View>
              )}

              <View style={styles.textoRodapeContainer}>
                <Text style={styles.textoRodape1}>Já tem uma conta? </Text>
                <Text style={styles.textoRodape2} onPress={logarSe}>
                  Entre agora
                </Text>
              </View>
            </View>
          </Animated.ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Componente de aviso flutuante dinâmico */}
      <Snackbar
        visible={snackbarVisivel}
        onDismiss={() => setSnackbarVisivel(false)}
        duration={3000}
        style={[
          styles.snackbar, 
          { backgroundColor: coresAtuais.snackbarFundo || '#2b2b2b' },
          isDarkMode && styles.snackbarNeonBorder
        ]}
        action={{
          label: 'OK',
          textColor: '#ff5252',
          onPress: () => setSnackbarVisivel(false),
        }}
      >
        <Text style={[styles.snackbarText, { color: coresAtuais.snackbarTexto || '#fff' }]}>
          {mensagemErro}
        </Text>
      </Snackbar>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: 20,
  },
  inner: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 25,
    paddingBottom: 30,
    paddingTop: 20,
  },
  voltar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { 
      width: 0, 
      height: 4 
    },
    elevation: 4,
  },
  titulo: {
    fontSize: 28,
    fontFamily: 'Poppins_700Bold',
    color: "#000000",
  },
  subtitulo: {
    fontSize: 15,
    fontFamily: 'Urbanist_500Medium',
    color: '#111111',
    marginTop: 4,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  progressStepActive: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1e232c",
    justifyContent: "center",
    alignItems: "center",
  },
  progressStep: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  progressTextActive: {
    color: "#FFF",
    fontWeight: "700",
  },
  progressText: {
    color: "#1e232c",
    fontWeight: "700",
  },
  progressLine: {
    width: 60,
    height: 3,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
  },
  progressLineActive: {
    backgroundColor: "#1e232c",
  },
  formCard: {
    width: '100%',
  },
  input: {
    height: 52,
    width: '100%',
    borderRadius: 12,
    marginBottom: 14,
    paddingHorizontal: 15,
    backgroundColor: '#ffffff',
    borderColor: '#d1d1d1',
    borderWidth: 1,
    fontFamily: 'Urbanist_500Medium',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 2,
    color: '#1e232c',
  },
  inputSenhaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#d1d1d1',
    borderWidth: 1,
    borderRadius: 12,
    height: 52,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 2,
  },
  inputSenha: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 15,
    fontFamily: 'Urbanist_500Medium',
    color: '#1e232c',
  },
  eyeIcon: {
    paddingHorizontal: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botaoRegistrar: {
    marginTop: 10,
    width: '100%',
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    backgroundColor: '#1e232c',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  textoRodapeContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  textoRodape1: {
    fontSize: 15,
    fontFamily: 'Urbanist_500Medium',
    color: '#1e232c',
  },
  textoRodape2: {
    fontSize: 15,
    fontFamily: 'Urbanist_700Bold',
    color: '#0663EF',
  },
  cardLogin: {
		backgroundColor: "#FFF",
		borderRadius: 28,
		padding: 24,
		shadowColor: "#000",
		shadowOpacity: 0.06,
		shadowRadius: 20,
		shadowOffset: {
			width: 0,
			height: 8,
		},
		elevation: 5,
	},
  snackbar: {
    borderRadius: 12,
    position: 'absolute',       // Garante que ele flutue fixo na base
    bottom: 20,                 // Distância do final da tela
    left: 15,
    right: 15,
    elevation: 4,               // Sombra no Android
  },
  snackbarText: {
    color: '#fff',
    fontWeight: '500',
  },
  snackbarNeonBorder: {
    borderWidth: 0.8,           // Borda bem pequena/fina
    borderColor: '#91dbd6',
    // Opcional: Adiciona um leve brilho no Android/iOS se desejar
    shadowColor: '#91dbd6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
  }
});

// Estilos específicos para espelhar o design dos inputs antigos nos Pickers
const pickerStyles = StyleSheet.create({
  pickerContainer: {
    backgroundColor: '#ffffff',
    borderColor: '#d1d1d1',
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 14,
    height: 52,
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 2,
  },
  inputIOS: {
    fontSize: 16,
    paddingHorizontal: 15,
    paddingRight: 40, // Espaço para o ícone
    color: '#1e232c',
    fontFamily: 'Urbanist_500Medium',
    height: '100%',
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 15,
    paddingRight: 40, // Espaço para o ícone
    color: '#1e232c',
    fontFamily: 'Urbanist_500Medium',
    height: '100%',
  },
  icon: {
    position: 'absolute',
    right: 15,
    top: 15,
  },
});