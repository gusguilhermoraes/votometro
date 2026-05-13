import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, StatusBar, Animated, Dimensions, TouchableWithoutFeedback } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { auth } from '@/firebaseconfig';

const { width } = Dimensions.get('window');
const menuWidth = width * 0.7;

export default function Home() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const slideAnim = useState(new Animated.Value(-menuWidth))[0];
  const user = auth.currentUser;
  const nomeUsuario = user?.displayName || user?.email || 'Usuário';
  console.log(user.uid);

  const toggleMenu = () => {
    Animated.timing(slideAnim, {
      toValue: menuOpen ? -menuWidth : 0,
      duration: 250,
      useNativeDriver: false,
    }).start(() => setMenuOpen(!menuOpen));
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/welcome');
    } catch (error) {
      console.error('Erro ao sair:', error);
    }
  };

  const pesquisarCandidatos = () => {
    router.push('/candidatos/pesquisaCandidato');
  };

  const pesquisarPoliticos = () => {
    router.push('/politicos/pesquisaPolitico');
  };

  const pesquisarProjetos = () => {
    router.push('/projetos/pesquisaProjeto');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={toggleMenu} style={styles.menuButton}>
           <View style={styles.fotoMenu} />
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        
          <Image
            source={require('../assets/images/logo-votometro.png')}
            style={{ width: '95%', height: '50%' }}
            resizeMode="contain"
          />
        
        <Text style={styles.subtitulo}>
          Bem-vindo{"\n"}Selecione abaixo a sua opção desejada
        </Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.button} onPress={pesquisarCandidatos}>
            <Text style={styles.buttonText}>Pesquisar candidatos</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={pesquisarPoliticos}>
            <Text style={styles.buttonText}>Pesquisar políticos</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={pesquisarProjetos}>
            <Text style={styles.buttonText}>Pesquisar projetos</Text>
          </TouchableOpacity>
        </View>
      </View>
      {/* --- COMPONENTES DO MENU LATERAL --- */}
      {/* Overlay (Fundo escuro) */}
      {menuOpen && (
        <TouchableWithoutFeedback onPress={toggleMenu}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>
      )}
      {/* Drawer (Menu Deslizante) */}
      <Animated.View style={[styles.drawer, { left: slideAnim }]}>
        <View style={styles.profile}>
          <Image
            source={{ uri: `https://i.pravatar.cc/100?u=${user?.uid || 'usuario'}` }}
            style={styles.avatar}
          />
          <Text style={styles.welcome}>Olá, {nomeUsuario.split('@')[0]}</Text>
        </View>
        <View style={styles.menuItems}>
          <DrawerItem label="Início" icon="home" onPress={() => { }} />
          <DrawerItem label="Favoritos" icon="favorite" onPress={() => { }} />
          <DrawerItem label="Perfil" icon="person" onPress={() => { }} />
          <DrawerItem label="Sair" icon="logout" onPress={handleLogout} />
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

// Sub-componente para os itens do menu
function DrawerItem({ label, icon, onPress }) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <MaterialIcons name={icon} size={22} color="#444" />
      <Text style={styles.menuLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#009440",
  },
  header: {
    padding: 20,
  },
  menuButton: {
    position: 'absolute', 
    top: 20, 
    left: 20,
    backgroundColor: 'white', 
    padding: 3, 
    borderRadius: 25, 
    elevation: 4, 
    zIndex: 10,
  },
  fotoMenu: {
    width: 45,
    height: 45,
    borderRadius: 25,
    backgroundColor: "#D9D9D9",
  },
  content: {
    alignItems: "center",
    flex: 1,
  },
  logoContainer: {
    width: 110,
    height: 110,
    backgroundColor: "#FFCB00",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  logoText: {
    fontSize: 40,
  },
  subtitulo: {
    color: "#fff",
    textAlign: "center",
    marginTop: 10,
    fontSize: 16,
    lineHeight: 22,
  },
  card: {
    backgroundColor: "#FFCB00",
    width: "85%",
    borderRadius: 20,
    padding: 20,
    marginTop: 30,
  },
  button: {
    backgroundColor: "#EDEDED",
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
    alignItems: "center",
    elevation: 3, // sombra Android
  },
  buttonText: {
    fontWeight: "500",
    color: "#2C3E50",
  },
  overlay: {
    position: 'absolute', top: 0, bottom: 0,
    left: menuWidth, right: 0,
    backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 15,
  },
  drawer: {
    position: 'absolute', top: 0, bottom: 0, width: menuWidth,
    backgroundColor: '#fff', paddingTop: 80, paddingHorizontal: 20,
    elevation: 8, zIndex: 20,
  },
  profile: { flexDirection: 'row', alignItems: 'center', marginBottom: 30 },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  welcome: { marginLeft: 12, fontSize: 16, fontWeight: '600', color: '#333' },
  menuItems: { gap: 18 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
  menuLabel: { fontSize: 16, color: '#333' },
});