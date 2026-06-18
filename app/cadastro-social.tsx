import React, { useState } from 'react';
import { View, Text, Alert, StyleSheet, ScrollView, KeyboardAvoidingView, TouchableOpacity, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth'; // Importações adicionadas
import { auth, db, storage } from '../firebaseconfig'; // Certifique-se de importar o 'auth' também
import { doc, setDoc } from 'firebase/firestore';
import { Button } from 'react-native-paper';
import RNPickerSelect from 'react-native-picker-select';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';

export default function CadastroSocial() {
  const router = useRouter();
  
  // Recebe o idToken do Google em vez do uid direto
  const { idToken, email, username, provider, photo } = useLocalSearchParams<{
    idToken: string;
    email: string;
    username: string;
    provider: string;
    photo: string;
  }>();

  const [sexo, setSexo] = useState('');
  const [anoNascimento, setAnoNascimento] = useState('');
  const [estado, setEstado] = useState('');
  const [loading, setLoading] = useState(false);

  const { tema, coresAtuais } = useTheme();
  const isDarkMode = tema === 'escuro';

  const anoAtual = new Date().getFullYear() - 15;
  const anosItens = Array.from({ length: anoAtual - 1900 + 1 }, (_, i) => {
    const ano = (anoAtual - i).toString();
    return { label: ano, value: ano };
  });

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

  const handleFinalizarCadastro = async () => {
    if (!sexo || !anoNascimento || !estado) {
      Alert.alert('Erro', 'Por favor, selecione todas as informações.');
      return;
    }

    setLoading(true);
    try {
      // 1. Autentica o usuário no Firebase Auth usando o token do Google
      const credential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(auth, credential);
      const user = userCredential.user;

      let fotoFinalUrl = photo || ''; // URL padrão caso falte a foto

      // 2. Se o Google retornou uma foto, faz o processo de upload para o Storage
      if (photo) {
        try {
          // Baixa a imagem da URL do Google como um Blob binário
          const response = await fetch(photo);
          const blob = await response.blob();
          
          // Cria a referência do arquivo no Storage: "fotos_perfil/ID_DO_USUARIO.jpg"
          const storageRef = ref(storage, `fotos_perfil/${user.uid}.jpg`);

          // Faz o upload do blob para o Storage
          await uploadBytes(storageRef, blob);

          // Pega a URL definitiva de download de dentro do seu Firebase Storage
          fotoFinalUrl = await getDownloadURL(storageRef);
        } catch (storageError) {
          console.log("Erro ao salvar foto no Storage, usando URL original:", storageError);
          // Se falhar o Storage por regras de segurança ou rede, mantém a URL original do Google para não travar o cadastro
          fotoFinalUrl = photo; 
        }
      }

      // 3. Salva o perfil completo no Firestore
      await setDoc(doc(db, 'usuarios', user.uid), {
        username: username,
        email: email,
        sexo: sexo,
        ano_nascimento: parseInt(anoNascimento, 10),
        estado_moradia: estado,
        foto_perfil: fotoFinalUrl, // <-- Aqui vai a URL do seu Firebase Storage!
        data_criacao: new Date().toISOString(),
        tipo: 'comum',
        provider: provider,
      });

      Alert.alert('Sucesso', 'Cadastro concluído com sucesso!');
      router.replace('/home');
    } catch (error: any) {
      console.log(error);
      Alert.alert('Erro', 'Não foi possível finalizar o seu cadastro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const retornar = () => {
    router.back();
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.container, { backgroundColor: coresAtuais.primariaVerde }]}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <KeyboardAvoidingView
            style={styles.inner}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
              <TouchableOpacity style={styles.voltar} onPress={retornar}>
                <Feather name="arrow-left" size={22} color="#00A651" />
              </TouchableOpacity>
          
              <Text style={styles.titulo}>Quase lá!</Text>
              <Text style={styles.subtitulo}>
                Só precisamos de mais algumas informações para criar seu perfil.
              </Text>

              <View style={pickerStyles.pickerContainer}>
                <RNPickerSelect
                  placeholder={{ label: 'Selecione seu gênero...', value: null }}
                  value={sexo}
                  onValueChange={setSexo}
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

              <View style={pickerStyles.pickerContainer}>
                <RNPickerSelect
                  placeholder={{ label: 'Ano de nascimento...', value: null }}
                  value={anoNascimento}
                  onValueChange={setAnoNascimento}
                  items={anosItens}
                  style={pickerStyles}
                  useNativeAndroidPickerStyle={false}
                  Icon={() => <Feather name="chevron-down" size={20} color="#888" style={pickerStyles.icon} />}
                  pickerProps={{ mode: 'dropdown' }}
                />
              </View>

              <View style={pickerStyles.pickerContainer}>
                <RNPickerSelect
                  placeholder={{ label: 'Estado onde vota...', value: null }}
                  value={estado}
                  onValueChange={setEstado}
                  items={estadosItens}
                  style={pickerStyles}
                  useNativeAndroidPickerStyle={false}
                  Icon={() => <Feather name="chevron-down" size={20} color="#888" style={pickerStyles.icon} />}
                  pickerProps={{ mode: 'dropdown' }}
                />
              </View>

              {/* Botão estilizado com cor de fundo escura para destacar no fundo verde */}
              <Button
                mode="contained"
                onPress={handleFinalizarCadastro}
                loading={loading}
                disabled={loading}
                style={styles.botaoRegistrar}
                labelStyle={{ fontSize: 16, color: '#FFF', fontFamily: 'Urbanist_600SemiBold' }}
              >
                Criar minha conta
              </Button>
            </ScrollView>
          </KeyboardAvoidingView>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
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
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  titulo: {
    fontSize: 28,
    fontFamily: 'Poppins_700Bold',
    color: "#ffffff",
  },
  subtitulo: {
    fontSize: 15,
    fontFamily: 'Urbanist_500Medium',
    color: '#e0f2fe',
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
    color: '#ffffff',
  },
  textoRodape2: {
    fontSize: 15,
    fontFamily: 'Urbanist_700Bold',
    color: '#1e232c',
  },
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