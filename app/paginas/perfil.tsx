import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  StatusBar, 
  ScrollView,
  Dimensions, 
  Alert,
  ActivityIndicator
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { auth, db, storage } from '@/firebaseconfig'; 
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import { setAppIcon } from "@howincodes/expo-dynamic-app-icon";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/context/ThemeContext';

// Importação das logos do Votômetro para a pré-visualização na tela
const logoPadrao = require('@/assets/images/icon.png');
const logoDark = require('@/assets/images/icon-dark.png');

// O nome da chave deve ser EXATAMENTE igual ao configurado nos aliases do app.json
const LOGOS_DISPONIVEIS: Record<string, any> = {
  'defaultLight': logoPadrao, // Ícone padrão
  'defaultDark': logoDark,
};

const { width } = Dimensions.get("window");

export default function Perfil() {
  const router = useRouter();
  const user = auth.currentUser;
  const nomeUsuario = user?.displayName || user?.email?.split('@')[0] || 'Usuário';

  const { tema, coresAtuais, mudarTema } = useTheme();
  const isDarkMode = tema === 'escuro';

  // Estados principais
  const [fotoPerfil, setFotoPerfil] = useState<string>(`https://i.pravatar.cc/150?u=${user?.uid || 'default'}`);
  const [iconeHome, setIconeHome] = useState<string>('default');
  const [carregandoFoto, setCarregandoFoto] = useState<boolean>(false);

  useEffect(() => {
    const buscarDadosPerfil = async () => {
        // Busca o ícone salvo localmente
        try {
        const iconeSalvo = await AsyncStorage.getItem('@votometro:app_icon');
        if (iconeSalvo && LOGOS_DISPONIVEIS[iconeSalvo]) {
            setIconeHome(iconeSalvo);
        }
        } catch (e) {
        console.error("Erro ao ler ícone local:", e);
        }

        if (!user?.uid) return;
        try {
        const userDocRef = doc(db, "usuarios", user.uid);
        const docSnap = await getDoc(userDocRef);

        if (docSnap.exists()) {
            const dados = docSnap.data();
            if (dados.foto_perfil) setFotoPerfil(dados.foto_perfil);
        }
        } catch (error) {
        console.error("Erro ao buscar dados do Firestore:", error);
        }
    };

    buscarDadosPerfil();
    }, [user]);

  // Função para salvar preferências remotas (Tema)
  const atualizarPreferenciaRemota = async (chave: string, valor: string) => {
    if (!user?.uid) return;
    try {
      const userDocRef = doc(db, "usuarios", user.uid);
      await updateDoc(userDocRef, { [chave]: valor });
    } catch (error) {
      console.error("Erro ao salvar preferência remota:", error);
    }
  };

  const handleAlterarFoto = async () => {
    if (!user?.uid) return;

    try {
      if (!ImagePicker.requestMediaLibraryPermissionsAsync) {
        Alert.alert("Módulo Nativo Ausente", "Execute o build nativo do projeto para habilitar a galeria.");
        return;
      }

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permissão necessária", "Precisamos de acesso à sua galeria.");
        return;
      }

      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true, 
        aspect: [1, 1],
        quality: 0.5, 
      });

      if (resultado.canceled || !resultado.assets?.[0]?.uri) return;

      const uriLocal = resultado.assets[0].uri;
      setCarregandoFoto(true);

      const resposta = await fetch(uriLocal);
      const blob = await resposta.blob();

      const storageRef = ref(storage, `perfis/${user.uid}.jpg`);
      await uploadBytes(storageRef, blob);

      const urlPublica = await getDownloadURL(storageRef);

      setFotoPerfil(urlPublica);
      await atualizarPreferenciaRemota("foto_perfil", urlPublica);

      Alert.alert("Sucesso", "Sua foto de perfil foi atualizada!");
    } catch (error) {
      console.error(error);
      Alert.alert("Erro", "Houve um problema ao salvar sua foto.");
    } finally {
      setCarregandoFoto(false);
    }
  };

  const handleMudarIconeDoAplicativo = async (iconId: string) => {
    try {
        // Se for o defaultLight, envia null para restaurar o ícone padrão do app.json
        // Se for o defaultDark, envia a string 'defaultDark' idêntica ao app.json
        const nomeIconeNativo = iconId;
        
        // 1. Executa a troca nativa
        await setAppIcon(nomeIconeNativo);
        
        // 2. SALVA LOCALMENTE
        await AsyncStorage.setItem('@votometro:app_icon', iconId);
        
        // 3. ATUALIZA O ESTADO
        setIconeHome(iconId);

        Alert.alert('Ícone alterado!', `Ícone alterado com sucesso.`);
    } catch (e) {
        console.error(e);
        Alert.alert('Erro', 'Não foi possível trocar o ícone nativamente.');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/welcome');
    } catch (error) {
      console.error('Erro ao sair:', error);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: coresAtuais.fundo }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: coresAtuais.primariaVerde }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meu Perfil</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Seção da Foto de Perfil */}
        <View style={[styles.profileCard, { backgroundColor: coresAtuais.primariaVerde }]}>
          <View style={styles.avatarContainer}>
            <Image source={{ uri: fotoPerfil }} style={[styles.avatar, { borderColor: coresAtuais.secundariaAmarelo }]} />
            {carregandoFoto ? (
              <View style={[styles.editPhotoButton, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
                <ActivityIndicator size="small" color="#FFF" />
              </View>
            ) : (
              <TouchableOpacity style={styles.editPhotoButton} onPress={handleAlterarFoto}>
                <MaterialIcons name="photo-camera" size={18} color="#FFF" />
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.userName}>{nomeUsuario}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>

        {/* Configurações: Aparência & Tema */}
        <View style={[styles.section, { backgroundColor: coresAtuais.card }]}>
          <Text style={[styles.sectionTitle, { color: coresAtuais.texto }]}>Aparência</Text>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <MaterialIcons name="palette" size={22} style={[{color: coresAtuais.icones}]} />
              <Text style={[styles.settingLabel, { color: coresAtuais.settingLabelText }]}>Tema do Aplicativo</Text>
            </View>
            <View style={styles.toggleContainer}>
              <TouchableOpacity 
                style={[styles.toggleOption, tema === 'claro' && styles.toggleActive]} 
                onPress={() => mudarTema('claro')}
              >
                <Text style={[styles.toggleText, tema === 'claro' && styles.toggleTextActive]}>Claro</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.toggleOption, tema === 'escuro' && styles.toggleActive]} 
                onPress={() => mudarTema('escuro')}
              >
                <Text style={[styles.toggleText, tema === 'escuro' && styles.toggleTextActive]}>Escuro</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Configurações: Alterar ícone nativo da tela inicial */}
        <View style={[styles.section, { backgroundColor: coresAtuais.card }]}>
          <Text style={[styles.sectionTitle, { color: coresAtuais.texto }]}>Ícone da Tela Inicial</Text>
          <Text style={[styles.sectionSubtitle, { color: coresAtuais.textoSecundario }]}>Selecione abaixo a logo que aparecerá na tela inicial do seu celular:</Text>
          
          <View style={styles.iconGrid}>
            {Object.keys(LOGOS_DISPONIVEIS).map((chaveLogo) => (
              <TouchableOpacity
                key={chaveLogo}
                style={[
                  styles.iconOption,
                  iconeHome === chaveLogo && styles.iconOptionSelected
                ]}
                onPress={() => handleMudarIconeDoAplicativo(chaveLogo)}
              >
                <Image 
                  source={LOGOS_DISPONIVEIS[chaveLogo]} 
                  style={styles.logoImagePreview}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Ações da Conta */}
        <View style={[styles.section, { backgroundColor: coresAtuais.card }]}>
          <Text style={[styles.sectionTitle, { color: coresAtuais.texto }]}>Conta</Text>
          <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert("Suporte", "Redirecionando...")}>
            <MaterialIcons name="help-outline" size={22} color="#444" />
            <Text style={[styles.menuLabel, { color: coresAtuais.settingLabelText } ]}>Suporte & Ajuda</Text>
            <MaterialIcons name="chevron-right" size={22} color="#CCC" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuItem, styles.logoutItem]} onPress={handleLogout}>
            <MaterialIcons name="logout" size={22} color="#D32F2F" />
            <Text style={[styles.menuLabel, styles.logoutLabel]}>Sair da Conta</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  header: { 
    paddingHorizontal: 20, 
    paddingBottom: 15, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between' 
  },
  backButton: { 
    padding: 8 
  },
  headerTitle: { 
    color: "#FFF", 
    fontSize: 20, 
    fontWeight: "bold" 
  },
  scrollContent: { 
    paddingBottom: 30 
  },
  profileCard: { 
    alignItems: "center", 
    paddingBottom: 30, 
    borderBottomLeftRadius: 30, 
    borderBottomRightRadius: 30, 
    elevation: 4 
  },
  avatarContainer: { 
    position: 'relative', 
    marginTop: 10 
  },
  avatar: { 
    width: 110, 
    height: 110, 
    borderRadius: 55, 
    borderWidth: 4 
  },
  editPhotoButton: { 
    position: 'absolute', 
    bottom: 0, 
    right: 5, 
    backgroundColor: '#302681', 
    padding: 8, 
    borderRadius: 20, 
    elevation: 3, 
    justifyContent: 'center', 
    alignItems: 'center', 
    width: 36, 
    height: 36 
  },
  userName: { 
    color: "#FFF", 
    fontSize: 22, 
    fontWeight: "bold", 
    marginTop: 15 
  },
  userEmail: { 
    color: "#FFF", 
    fontSize: 14, 
    marginTop: 4 
  },
  section: { 
    marginHorizontal: 16, 
    marginTop: 20, 
    borderRadius: 16, 
    padding: 16, 
    elevation: 2 
  },
  sectionTitle: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    marginBottom: 12 
  },
  sectionSubtitle: { 
    fontSize: 13, 
    marginBottom: 12, 
    lineHeight: 18 
  },
  settingRow: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  settingInfo: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 10 
  },
  settingLabel: { 
    fontSize: 15 
  },
  toggleContainer: { 
    flexDirection: 'row', 
    backgroundColor: '#EDEDED', 
    borderRadius: 20, 
    padding: 3, 
    marginLeft: 'auto' 
  },
  toggleOption: { 
    paddingVertical: 6, 
    paddingHorizontal: 12, 
    borderRadius: 18 
  },
  toggleActive: { 
    backgroundColor: '#FFCB00' 
  },
  toggleText: { 
    fontSize: 13, 
    fontWeight: '500', 
    color: '#666' 
  },
  toggleTextActive: { 
    color: '#302681', 
    fontWeight: 'bold' 
  },
  iconGrid: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginTop: 5 
  },
  iconOption: { 
    width: (width - 80) / 4, 
    height: 55, 
    backgroundColor: '#F5F5F5', 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: '#E0E0E0', 
    padding: 6 
  },
  iconOptionSelected: { 
    backgroundColor: '#FFCB0033', 
    borderColor: '#FFCB00', 
    borderWidth: 2 
  },
  logoImagePreview: { 
    width: '100%', 
    height: '100%' 
  },
  menuItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12, 
    paddingVertical: 12,
    borderBottomWidth: 1, 
    borderBottomColor: '#F0F0F0' 
  },
  logoutItem: { 
    borderBottomWidth: 0, 
    marginTop: 5 
  },
  menuLabel: { 
    fontSize: 15 
  },
  logoutLabel: { 
    color: '#D32F2F', 
    fontWeight: '500' 
  },
});