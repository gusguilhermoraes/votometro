import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator, TouchableOpacity, Linking } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { db } from '../../firebaseconfig';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { Card, Button } from 'react-native-paper';
import { FontAwesome6, FontAwesome } from '@expo/vector-icons';
import { getApp } from 'firebase/app';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getAuth } from 'firebase/auth';
import { useTheme } from '@/context/ThemeContext';

export default function DetalhesParlamentar() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [parlamentar, setParlamentar] = useState(null);
  const [partido, setPartido] = useState(null);
  const [projetos, setProjetos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isFavorito, setIsFavorito] = useState(false);
  const [loadingFavorito, setLoadingFavorito] = useState(false);
  
  const { tema, coresAtuais } = useTheme();
  const isDarkMode = tema === 'escuro';

  const obterInstanciaFunctions = () => {
    return getFunctions(getApp(), 'us-central1'); 
  };

  // Ajustado: Passando referenciador de ciclo de vida para o escopo interno
  const buscarDados = async (mountedRef: boolean) => {
    try {
      if (mountedRef) setLoading(true);

      const docRef = doc(db, 'parlamentar', id as string);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
         
        const dataNascFormatada = data.dataNasc?.toDate 
          ? data.dataNasc.toDate().toLocaleDateString('pt-BR') 
          : 'Não informada';

        if (mountedRef) {
          setParlamentar({ ...data, dataNascFormatada });
        }

        // Traz os projetos da coleção 'projetos'
        const projetosSnap = await getDocs(collection(db, 'projeto'));
        const todosProjetos = projetosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Filtra no front-end para encontrar onde o ID do político aparece em autor1 ou autor2
        const projetosDoPolitico = todosProjetos.filter((p: any) => {
          return p.autores?.autor1?.idPolitico === id || p.autores?.autor2?.idPolitico === id;
        });

        if (mountedRef) {
          setProjetos(projetosDoPolitico);
        }

        if (data.partidoId) {
          const partidoRef = doc(db, 'partidos', data.partidoId);
          const partidoSnap = await getDoc(partidoRef);
          if (partidoSnap.exists() && mountedRef) {
            setPartido(partidoSnap.data());
          }
        }

        // Passando a trava síncrona adiante
        await verificarSeEIdFavorito(mountedRef);
      }
    } catch (error) {
      console.error("Erro ao buscar detalhes:", error);
    } finally {
      if (mountedRef) setLoading(false);
    }
  };

  const verificarSeEIdFavorito = async (mountedRef: boolean) => {
    const auth = getAuth();
    if (!auth.currentUser) return;

    try {
      const functions = obterInstanciaFunctions();
      const buscarFavoritosFn = httpsCallable(functions, 'favorites-buscarFavoritos');
      const resultado: any = await buscarFavoritosFn();
      
      const favoritos = resultado.data.favoritos || [];
      const jaEIdFavorito = favoritos.some((fav: any) => fav.id === id);
      
      if (mountedRef) {
        setIsFavorito(jaEIdFavorito);
      }
    } catch (error) {
      console.error('Erro ao verificar status de favorito:', error);
    }
  };

  const alternarFavorito = async () => {
    const auth = getAuth();
    if (!auth.currentUser) {
      alert("Você precisa estar logado para favoritar um político!");
      return;
    }

    if (loadingFavorito) return;
    
    setLoadingFavorito(true);
    const functions = obterInstanciaFunctions();

    try {
      await auth.currentUser.getIdToken(true);

      if (isFavorito) {
        const removerFn = httpsCallable(functions, 'favorites-removerFavorito');
        await removerFn({ itemId: id, userUid: auth.currentUser.uid });
        setIsFavorito(false);
      } else {
        const adicionarFn = httpsCallable(functions, 'favorites-adicionarFavorito');
        await adicionarFn({ itemId: id, tipoItem: 'politico', userUid: auth.currentUser.uid });
        setIsFavorito(true);
      }
    } catch (error) {
      console.error('Erro ao alternar favorito:', error);
      alert("Não foi possível atualizar o favorito. Tente novamente.");
    } finally {
      setLoadingFavorito(false);
    }
  };  

  useEffect(() => {
    let isMounted = true; // Ativação da trava local

    if (id) {
      buscarDados(isMounted);
    }

    return () => {
      isMounted = false; // Sinaliza que a tela foi desmontada
    };
  }, [id]);
  
  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: coresAtuais.primariaVerde }]}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }
  
  if (!parlamentar) {
    return <Text>Parlamentar não encontrado</Text>;
  }
  
  return (
    <>

    <Stack.Screen 
      options={{ 
        title: `Parlamentar ${parlamentar.nome}`,
        headerStyle: {
          backgroundColor: coresAtuais.primariaVerde
        },
        headerTintColor: coresAtuais.texto,
        headerTitleAlign: "center",
      }} 
    />

    <ScrollView style={[styles.container, {backgroundColor: coresAtuais.primariaVerde }]}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <Image
            source={{ uri: parlamentar.fotoUrl || `https://firebasestorage.googleapis.com/v0/b/votometro-adad1.firebasestorage.app/o/fotos_perfil%2Fusuario_padrao.png?alt=media&token=621ae248-d53d-4f9d-8305-400703a059be` }}
            style={styles.avatar}
          />
          <View style={styles.headerText}>
            <Text style={styles.nomeParlamentar}>{parlamentar.nome}</Text>
            <Text style={styles.subtitulo}>{parlamentar.cargo}(a) - {parlamentar.local}</Text>
          </View>
        </View>

        {/* BOTÃO DA ESTRELA DE FAVORITOS */}
        <TouchableOpacity 
          style={styles.botaoEstrela} 
          onPress={alternarFavorito}
          disabled={loadingFavorito}
        >
          {loadingFavorito ? (
            <ActivityIndicator size="small" color="#FFD700" />
          ) : (
            <FontAwesome 
              name={isFavorito ? "star" : "star-o"} 
              size={28} 
              color="#FFD700" 
            />
          )}
        </TouchableOpacity>        

        <View style={styles.infoSection}>
          <Text style={styles.label}>Nome Completo:</Text>
          <Text style={styles.valor}>{parlamentar.nomeCompleto}</Text>

          <Text style={styles.label}>Nascimento:</Text>
          <Text style={styles.valor}>{parlamentar.dataNascFormatada} ({parlamentar.genero})</Text>

          <Text style={styles.label}>Formação/Instrução:</Text>
          <Text style={styles.valor}>{parlamentar.formacao} - {parlamentar.instrucao}</Text>
          
          <Text style={styles.label}>Fim do Mandato:</Text>
          <Text style={styles.valor}>{parlamentar.fim_mandato}</Text>
        </View>
        {/* Seção de Redes Sociais */}
        <View style={styles.redesContainer}>
          {parlamentar?.redesSociais && Object.keys(parlamentar?.redesSociais || {}).map((rede) => {
            const link = parlamentar.redesSociais[rede];
            if (!link) return null;
    
            return (
              <TouchableOpacity 
                key={rede} 
                onPress={() => Linking.openURL(link)}
                style={styles.iconeBotao}
              >
                <FontAwesome6 
                  name={rede === 'instagram' ? 'instagram' : rede === 'facebook' ? 'facebook' : rede === 'tiktok' ? 'tiktok' : rede === 'youtube' ? 'youtube' : rede === 'x' ? 'x-twitter' : rede === 'email' ? 'envelope' : 'globe'} 
                  size={30} 
                  color={rede === 'instagram' ? '#E4405F' : rede === 'facebook' ? '#1877F2' : rede === 'tiktok' ? '#000000' : rede === 'youtube' ? '#FF0000' : rede === 'x' ? '#000000' : 'globe'} 
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </Card>

      {partido && (
        <Card style={styles.card}>
          <Text style={styles.titulo}>Partido</Text>
          <View style={styles.headerPartido}>
            <View style={styles.colunaImagem}>
              {partido.logo ? (
                <Image 
                  source={{ uri: partido.logo }} 
                  style={styles.logoPartido} 
                />
              ) : (
                <Text style={styles.detalhePartido}>Sem logo</Text>
              )}
            </View>

            <View style={styles.colunaTexto}>
              <Text style={styles.nomePartido}>
                {partido.nome || ''} ({partido.sigla || ''})
              </Text>
              <Text style={styles.detalhePartido}>Número: {partido.numero || ''}</Text>
              <Text style={styles.detalhePartido}>Espectro político: {partido.espectro || ''}</Text>
            </View>
          </View>
        </Card>
      )}      

      {/* CARD DE PROJETOS DE LEI */}
      <Card style={styles.card}>
        <Text style={styles.tituloSecao}>Projetos de Lei</Text>
        {projetos.length > 0 ? (
          projetos.map((p: any) => (
            <TouchableOpacity 
              key={p.id} 
              style={styles.itemListaProjetos} 
              onPress={() => router.push(`/projetos/${p.id}`)} // Ajuste a rota conforme sua estrutura do Expo Router
            >
              <View style={styles.projetoHeader}>
                <Text style={styles.projetoAno}>{p.tipoSigla || 'S/A'} {p.numero || 'S/A'}/{p.ano || 'S/A'}</Text>
                <View style={styles.tagsContainer}>
                  {p.areaTematica?.map((tema: string, index: number) => (
                    <View key={index} style={styles.tagTema}>
                      <Text style={styles.tagTexto}>{tema}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <Text style={styles.projetoDescricao} numberOfLines={3}>
                {p.descricao || 'Sem descrição cadastrada.'}
              </Text>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.semDadosTexto}>Nenhum projeto de lei registrado para este parlamentar.</Text>
        )}
      </Card>
    </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    padding: 10 
  },
  card: { 
    padding: 15, 
    borderRadius: 12, 
    marginBottom: 10, 
    backgroundColor: '#fff' 
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 15 
  },
  headerText: { 
    marginLeft: 15 
  },
  nomeParlamentar: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#333' 
  },
  subtitulo: { 
    fontSize: 14, 
    color: '#666' 
  },
  infoSection: { 
    marginTop: 10 
  },
  label: { 
    fontWeight: 'bold', 
    color: '#009440', 
    marginTop: 8 
  },
  valor: { 
    fontSize: 15 
  },
  tituloSecao: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginBottom: 10 
  },
  itemLista: { 
    paddingVertical: 10, 
    borderBottomWidth: 0.5, 
    borderBottomColor: '#ccc' 
  },
  itemTexto: { 
    color: '#005da3' 
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 10
  },
  nomePartido: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },

  detalhePartido: {
    fontSize: 13,
    color: '#555',
  },

  redesContainer: {
    flexDirection: 'row',
    justifyContent: 'center', // Centraliza os ícones na tela
    alignItems: 'center',
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderRadius: 1,
    marginBottom: 1,
  },

  iconeBotao: {
    marginHorizontal: 15, // Espaço entre um ícone e outro
  },
  titulo: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginBottom: 10 
  },
  headerPartido: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingBottom: 10 
  },
  colunaImagem: { 
    width: '25%', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  logoPartido: { 
    width: 80, 
    height: 80, 
    borderRadius: 10, 
    resizeMode: 'contain' 
  },
  colunaTexto: { 
    flex: 1, 
    paddingLeft: 15 
  },
  botaoEstrela: { 
    position: 'absolute', 
    right: 0, 
    top: 0, 
    padding: 5 
  },
  itemListaProjetos: {
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#ccc',
  },
  projetoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  projetoAno: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#009440',
    marginRight: 10,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  tagTema: {
    backgroundColor: '#e0f2f1',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagTexto: {
    fontSize: 11,
    color: '#004d40',
    fontWeight: '600',
  },
  projetoDescricao: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
  },
  semDadosTexto: {
    color: '#777',
    fontStyle: 'italic',
    marginTop: 5,
  },
});