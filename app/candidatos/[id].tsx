import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator, TouchableOpacity, Linking } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { db, app } from '../../firebaseconfig';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { Card, Button } from 'react-native-paper';
import { FontAwesome6, FontAwesome } from '@expo/vector-icons';
import { getApp } from 'firebase/app';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getAuth } from 'firebase/auth';
import { useTheme } from '@/context/ThemeContext';

export default function DetalhesCandidato() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [candidato, setCandidato] = useState<any>(null);
  const [partido, setPartido] = useState<any>(null);
  const [propostas, setPropostas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isFavorito, setIsFavorito] = useState(false);
  const [loadingFavorito, setLoadingFavorito] = useState(false);

  const { coresAtuais, tema } = useTheme();
  const isDarkMode = tema === 'escuro';

  const obterInstanciaFunctions = () => {
    return getFunctions(getApp(), 'us-central1');
  };

  // Ajustado: Agora recebe a referência de montagem do componente
  const buscarDados = async (mountedRef: boolean) => {
    try {
      if (mountedRef) setLoading(true);

      // candidato
      const docRef = doc(db, 'candidatos', id as string);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();

        if (mountedRef) setCandidato(data);

        // partido
        if (data.partidoId) {
          const partidoRef = doc(db, 'partidos', data.partidoId);
          const partidoSnap = await getDoc(partidoRef);

          if (partidoSnap.exists() && mountedRef) {
            setPartido(partidoSnap.data());
          }
        }

        // propostas
        const propostasSnap = await getDocs(
          collection(db, `candidatos/${id}/propostas`)
        );

        const listaPropostas = propostasSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        if (mountedRef) {
          setPropostas(listaPropostas);
        }

        // Verificar favorito repassando o estado de montagem
        await verificarSeEIdFavorito(mountedRef);
      }

    } catch (error) {
      console.error('Erro ao carregar candidato:', error);
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
      alert("Você precisa estar logado para favoritar um candidato!");
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
        await adicionarFn({ itemId: id, tipoItem: 'candidato', userUid: auth.currentUser.uid });
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
    let isMounted = true; // Substituído a lógica do active por isMounted síncrono

    if (id) {
      buscarDados(isMounted);
    }

    return () => {
      isMounted = false; // Desativa a concorrência ao desmontar
    };
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  if (!candidato) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#009440' }}>
        <Text style={{ color: '#fff' }}>Candidato não encontrado</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: `Candidato ${candidato.nomeUrna || ''}`,
          headerStyle: {
            backgroundColor: coresAtuais.primariaVerde
          },
          headerTintColor: coresAtuais.texto,
          headerTitleAlign: "center",
        }}
      />

      <ScrollView style={[styles.container, { backgroundColor: coresAtuais.primariaVerde }]}>

        {/* CARD PRINCIPAL */}
        <Card style={[
          styles.card,
          isDarkMode && styles.neonBorder
        ]}>
          <View style={styles.header}>

            <Image
              source={{ uri: candidato.fotoUrl || `https://firebasestorage.googleapis.com/v0/b/votometro-adad1.firebasestorage.app/o/fotos_perfil%2Fusuario_padrao.png?alt=media&token=621ae248-d53d-4f9d-8305-400703a059be` }}
              style={styles.avatar}
            />

            <View style={{ flex: 1, paddingRight: 40 }}>
              <Text style={styles.nome}>{candidato.nomeUrna || ''}</Text>
              <Text>Candidato(a) a {candidato.cargo || ''} - {candidato.localCargo || ''}</Text>
              <Text style={styles.detalheCandidato}>
                Data de nascimento: {candidato.dataNasc?.toDate ? candidato.dataNasc.toDate().toLocaleDateString('pt-BR') : 'Sem data'}
              </Text>
              <Text style={styles.detalheCandidato}>Naturalidade: {candidato.naturalidade || ''}</Text>
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
          </View>

          <Text style={styles.detalheCandidato}>Nome Completo: {candidato.nomeCompleto || ''}</Text>
          <Text style={styles.detalheCandidato}>Profissão: {candidato.ocupacao || ''}</Text>
          <Text style={styles.detalheCandidato}>Escolaridade: {candidato.instrucao || ''}</Text>
          <Text style={styles.detalheCandidato}>Número do candidato: {candidato.numero || ''}</Text>

          {/* Seção de Redes Sociais */}
          <View style={styles.redesContainer}>
            {candidato?.redesSociais && Object.keys(candidato.redesSociais).map((rede) => {
              const link = candidato.redesSociais[rede];
              if (!link) return null;

              return (
                <TouchableOpacity
                  key={rede}
                  onPress={() => Linking.openURL(link)}
                  style={styles.iconeBotao}
                >
                  <FontAwesome6
                    name={rede === 'instagram' ? 'instagram' : rede === 'facebook' ? 'facebook' : rede === 'tiktok' ? 'tiktok' : rede === 'youtube' ? 'youtube' : rede === 'x' ? 'x-twitter' : 'globe'}
                    size={30}
                    color={rede === 'instagram' ? '#E4405F' : rede === 'facebook' ? '#1877F2' : rede === 'tiktok' ? '#000000' : rede === 'youtube' ? '#FF0000' : rede === 'x' ? '#000000' : 'globe'}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* CARD PARTIDO */}
        {partido && (
          <Card style={[
            styles.card,
            isDarkMode && styles.neonBorder
          ]}>
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

        {/* PROPOSTAS */}
        <Card style={[
          styles.card,
          isDarkMode && styles.neonBorder
        ]}>
          <Text style={styles.titulo}>Propostas</Text>

          {propostas.slice(0, 2).map((p, index) => (
            <TouchableOpacity
              key={index}
              style={styles.proposta}
              onPress={() => router.push(`/candidatos/proposta/${id}/${p.id}`)}
            >
              <Text>{p.nome || 'Proposta'}</Text>
            </TouchableOpacity>
          ))}

          <Button mode="contained">
            Conferir todas as propostas
          </Button>
        </Card>

      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#009440', 
    padding: 15 
  },
  card: { 
    backgroundColor: '#fff', 
    padding: 15, 
    borderRadius: 15, 
    marginBottom: 15 
  },
  header: { 
    flexDirection: 'row', 
    marginBottom: 10, 
    position: 'relative' 
  },
  avatar: { 
    width: 80, 
    height: 80, 
    borderRadius: 10,
    marginRight: 10 
  },
  nome: { 
    fontSize: 20, 
    fontWeight: 'bold' 
  },
  titulo: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginBottom: 10 
  },
  detalheCandidato: { 
    fontSize: 13, 
    color: '#555' 
  },
  proposta: { 
    backgroundColor: '#eee', 
    padding: 10, 
    borderRadius: 10, 
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
  nomePartido: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#333' 
  },
  detalhePartido: { 
    fontSize: 13, 
    color: '#555' 
  },
  redesContainer: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingVertical: 15, 
    backgroundColor: '#fff', 
    borderRadius: 1, 
    marginBottom: 1 
  },
  iconeBotao: { 
    marginHorizontal: 15 
  },
  botaoEstrela: { 
    position: 'absolute', 
    right: 0, 
    top: 0, 
    padding: 5 
  },
  neonBorder: {
    borderWidth: 0.8,           // Borda bem pequena/fina
    borderColor: '#91dbd6',
    // Opcional: Adiciona um leve brilho no Android/iOS se desejar
    shadowColor: '#91dbd6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
  }
});