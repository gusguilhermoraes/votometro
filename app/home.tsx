import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  StatusBar, 
  Animated, 
  Dimensions, 
  TouchableWithoutFeedback,
  FlatList // Substituindo o Carousel quebrado por um FlatList nativo
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, FontAwesome6 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { auth, db } from '@/firebaseconfig';
import { doc, getDoc } from 'firebase/firestore';
import { useTheme } from '@/context/ThemeContext';

const { width } = Dimensions.get('window');
const menuWidth = width * 0.7;
const ITEM_WIDTH = width * 0.85;

type CarouselItemProps = {
  icone: string;
  titulo: string;
  descricao: string;
  textoBotao: string
  linkFinal: string;
};

const carouselItems: CarouselItemProps[] = [
  {
    icone: 'check-to-slot',
    titulo: 'Pesquisa de candidatos',
    descricao: 'Pesquise e encontre candidatos para votar',
    textoBotao: 'Pesquisar candidatos',
    linkFinal: '/candidatos/pesquisaCandidato'
  },
  {
    icone: 'user-large',
    titulo: 'Pesquisa de políticos',
    descricao: 'Pesquise políticos e acompanhe seus trabalhos',
    textoBotao: 'Pesquisar políticos',
    linkFinal: '/politicos/pesquisaPolitico'
  },
  {
    icone: 'book-open',
    titulo: 'Pesquisa de Projetos',
    descricao: 'Pesquise projetos, acompanhe suas tramitações e deixe sua opinião',
    textoBotao: 'Pesquisar projetos',
    linkFinal: '/projetos/pesquisaProjeto'
  }
];

export default function Home() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const slideAnim = useState(new Animated.Value(-menuWidth))[0];
  const user = auth.currentUser;
  const nomeUsuario = user?.displayName || user?.email || 'Usuário';

  const [fotoPerfil, setFotoPerfil] = useState<string>(
    `https://i.pravatar.cc/100?u=usuario}`
  );

  const { tema, coresAtuais } = useTheme();
  const isDarkMode = tema === 'escuro';

  useEffect(() => {
    const buscarFotoPerfil = async () => {
      if (!user?.uid) return;

      try {
        const userDocRef = doc(db, "usuarios", user.uid);
        const docSnap = await getDoc(userDocRef);

        if (docSnap.exists()) {
          const dados = docSnap.data();
          if (dados.foto_perfil) {
            setFotoPerfil(dados.foto_perfil);
          }
        }
      } catch (error) {
        console.error("Erro ao buscar foto de perfil do Firestore:", error);
      }
    };

    buscarFotoPerfil();
  }, [user]);

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

  // Renderizador dos cards do Carrossel (FlatList)
  const renderCarouselItem = ({ item }: { item: CarouselItemProps }) => {
    return (
      <View style={[
        styles.carouselCard, 
        { backgroundColor: coresAtuais.secundariaAmarelo },
        isDarkMode && styles.neonBorder
      ]}>
        <FontAwesome6 
          name={item.icone} 
          size={30} 
          style={[styles.icone, {color: coresAtuais.icones}]} 
        />
        <Text style={[styles.cardTitle, { color: coresAtuais.texto }]}>{item.titulo}</Text>
        <Text style={[styles.cardDescription, { color: coresAtuais.texto }]}>{item.descricao}</Text>
        <TouchableOpacity 
          style={styles.cardButton} 
          onPress={() => router.push(item.linkFinal as any)}
        >
          <Text style={styles.cardButtonText}>{item.textoBotao}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: coresAtuais.primariaVerde }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      <View style={styles.header}>
        <TouchableOpacity onPress={toggleMenu} style={styles.menuButton}>
          <Image source={{ uri: fotoPerfil }} style={styles.fotoMenu} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.content}>
        <Image
          source={
            isDarkMode
              ? require('../assets/images/logo-votometro-dark.png') // Sua logo para o modo dark
              : require('../assets/images/logo-votometro.png')      // Sua logo padrão
          }
          style={{ width: '95%', height: '35%' }}
          resizeMode="contain"
        />
        
        <Text style={styles.subtitulo}>
          Bem-vindo{"\n"}Selecione abaixo a sua opção desejada
        </Text>
        <FlatList
          data={carouselItems}
          renderItem={renderCarouselItem}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToAlignment="center"
          snapToInterval={ITEM_WIDTH}
          decelerationRate="fast"
          contentContainerStyle={styles.carouselContainer}
          keyExtractor={(_, index) => index.toString()}
        />
      </View>

      {/* Overlay (Fundo escuro) */}
      {menuOpen && (
        <TouchableWithoutFeedback onPress={toggleMenu}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>
      )}

      {/* Drawer (Menu Deslizante) */}
      <Animated.View style={[styles.drawer, { left: slideAnim, backgroundColor: coresAtuais.card }, isDarkMode && styles.neonBorderLateral]}>
        <View style={styles.profile}>
          <Image
            source={{ uri: fotoPerfil }}
            style={styles.avatar}
          />
          <Text style={[styles.welcome, { color: coresAtuais.settingLabelText }]}>Olá, {nomeUsuario.split('@')[0]}</Text>
        </View>
        <View style={styles.menuItems}>
          <DrawerItem label="Início" icon="home" onPress={() => { }} />
          <DrawerItem label="Favoritos" icon="favorite" onPress={() => router.push('paginas/favoritos')}/>
          <DrawerItem label="Perfil" icon="person" onPress={() => router.push('paginas/perfil')} />
          <DrawerItem label="Sair" icon="logout" onPress={handleLogout} />
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

function DrawerItem({ label, icon, onPress }: { label: string, icon: any, onPress: () => void }) {
  const { tema } = useTheme();
  const isDarkMode = tema === 'escuro';
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <MaterialIcons name={icon} size={22} color={isDarkMode ? "#fff" : "#444"} />
      <Text style={[styles.menuLabel, { color: isDarkMode ? '#9AA0A6' : '#333' }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  header: { 
    padding: 20 
  },
  menuButton: {
    position: 'absolute', top: 20, left: 20,
    backgroundColor: 'white', padding: 3, borderRadius: 25, 
    elevation: 4, zIndex: 10,
  },
  fotoMenu: { 
    width: 45, 
    height: 45, 
    borderRadius: 22.5 
  },  
  content: { 
    alignItems: "center", 
    flex: 1 
  },
  subtitulo: { 
    color: "#fff", 
    textAlign: "center", 
    marginTop: 10, 
    fontSize: 16, 
    lineHeight: 22 
  },
  button: { 
    backgroundColor: "#EDEDED", 
    padding: 14, 
    borderRadius: 10, 
    marginBottom: 12, 
    alignItems: "center", 
    elevation: 3 
  },
  buttonText: { 
    fontWeight: "500", 
    color: "#2C3E50" 
  },
  overlay: { 
    position: 'absolute', 
    top: 0, 
    bottom: 0, 
    left: menuWidth, 
    right: 0, 
    backgroundColor: 'rgba(0,0,0,0.3)', 
    zIndex: 15 
  },
  drawer: { 
    position: 'absolute', 
    top: 0, 
    bottom: 0, 
    width: menuWidth, 
    backgroundColor: '#fff', 
    paddingTop: 80, 
    paddingHorizontal: 20, 
    elevation: 8, 
    zIndex: 20 
  },
  profile: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 30 
  },
  avatar: { 
    width: 48, 
    height: 48, 
    borderRadius: 24 
  },
  welcome: { 
    marginLeft: 12, 
    fontSize: 16, 
    fontWeight: '600' 
  },
  menuItems: { 
    gap: 18 
  },
  menuItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12, 
    paddingVertical: 6 
  },
  menuLabel: { 
    fontSize: 16 
  },
  carouselContainer: { 
    paddingVertical: 10 
  },
  carouselCard: {
    width: ITEM_WIDTH - 40,
    borderRadius: 25,
    padding: 24,
    marginRight: 20,
    marginLeft: 20,
    alignItems: "center",       // Centraliza os itens na horizontal
    justifyContent: "center",    // Centraliza os itens na vertical
    elevation: 4,               // Sombra suave para destacar o card
    minHeight: 350,             // Dá uma altura fixa confortável para não achatar o conteúdo
  },
  icone: { 
    borderRadius: 8, 
    marginBottom: 20 
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,           // Empurra o botão para baixo
    paddingHorizontal: 10,      // Evita que o texto encoste nas bordas do card
  },
  cardButton: {
    backgroundColor: "#EDEDED",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: "center",
    width: "95%",               // Faz o botão ocupar uma boa área do card, sem ficar gigante
    elevation: 2,
  },
  cardButtonText: {
    fontWeight: "600",
    color: "#2C3E50",
    fontSize: 16,
  },
  neonBorder: {
    borderWidth: 0.8,           // Borda bem pequena/fina
    borderColor: '#91dbd6',
    // Opcional: Adiciona um leve brilho no Android/iOS se desejar
    shadowColor: '#91dbd6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
  },
  neonBorderLateral: {
    borderRightWidth: 0.8,           // Borda bem pequena/fina
    borderColor: '#91dbd6',
    // Opcional: Adiciona um leve brilho no Android/iOS se desejar
    shadowColor: '#91dbd6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 5
  }
});