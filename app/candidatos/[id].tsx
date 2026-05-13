import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator, TouchableOpacity, Linking } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { db } from '../../firebaseconfig';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { Card, Button } from 'react-native-paper';
import { FontAwesome6 } from '@expo/vector-icons';

export default function DetalhesCandidato() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [candidato, setCandidato] = useState(null);
  const [partido, setPartido] = useState(null);
  const [propostas, setPropostas] = useState([]);
  const [loading, setLoading] = useState(true);

  const buscarDados = async () => {
    try {
      setLoading(true);

      // 🔹 candidato
      const docRef = doc(db, 'candidatos', id as string);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setCandidato(data);

        // 🔹 partido
        if (data.partidoId) {
          const partidoRef = doc(db, 'partidos', data.partidoId);
          const partidoSnap = await getDoc(partidoRef);

          if (partidoSnap.exists()) {
            setPartido(partidoSnap.data());
          }
        }

        // 🔹 propostas
        const propostasSnap = await getDocs(
          collection(db, `candidatos/${id}/propostas`)
        );

        const listaPropostas = propostasSnap.docs.map(doc => ({
          id: doc.id, // O ID real do documento no Firestore
          ...doc.data()
        }));

        setPropostas(listaPropostas);
      }

    } catch (error) {
      console.error('Erro ao carregar candidato:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    const carregar = async () => {
      if (active) {
        await buscarDados(); // Aguarde a execução
      }
    };

    carregar();
    return () => { active = false; };
  }, [id]);

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 50 }} />;
  }

  if (!candidato) {
    return <Text>Candidato não encontrado</Text>;
  }

  return (
    <>
    <Stack.Screen 
      options={{ 
        title: `Candidato ${candidato.nomeUrna}`, // Aqui você usa o ID no título
        headerStyle: {
          backgroundColor: "#009440",
        },
        headerTintColor: "black",
        headerTitleAlign: "center",
      }} 
    />
      

    <ScrollView style={styles.container}>

      {/* CARD PRINCIPAL */}
      <Card style={styles.card}>
        <View style={styles.header}>

          <Image
            source={{ uri: candidato.fotoUrl || `https://i.pravatar.cc/100?u=${candidato?.genero || 'usuario'}` }}
            style={styles.avatar}
          />

          <View style={{ flex: 1 }}>
            <Text style={styles.nome}>{candidato.nomeUrna}</Text>
            <Text>Candidato(a) a {candidato.cargo} - {candidato.localCargo}</Text>
            <Text style={styles.detalheCandidato}>Data de nascimento: {candidato.dataNasc?.toDate ? candidato.dataNasc.toDate().toLocaleDateString('pt-BR') : 'Sem data'}</Text>
            <Text style={styles.detalheCandidato}>Naturalidade: {candidato.naturalidade}</Text>
          </View>
        </View>

        <Text style={styles.detalheCandidato}>Profissão: {candidato.ocupacao}</Text>
        <Text style={styles.detalheCandidato}>Escolaridade: {candidato.instrucao}</Text>

        <Text style={styles.detalheCandidato}>Número do candidato: {candidato.numero}</Text>
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
      <Card style={styles.card}>
        <Text style={styles.titulo}>Partido</Text>
        <View style={styles.headerPartido}>
          <View style={styles.colunaImagem}>
            {partido?.logo ? (
              <Image 
                source={{ uri: partido.logo }} 
                style={styles.logoPartido} 
              />
            ) : (
              <View>
                <Text>Sem logo</Text>
              </View>
            )}
          </View>

          <View style={styles.colunaTexto}>
            <Text style={styles.nomePartido}>
              {partido?.nome} - ({partido?.sigla})
            </Text>
            <Text style={styles.detalhePartido}>Número: {partido?.numero}</Text>
            <Text style={styles.detalhePartido}>Espectro político: {partido?.espectro}</Text>
          </View>
        </View>
      </Card>

      {/* PROPOSTAS */}
      <Card style={styles.card}>
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
  container: { flex: 1, backgroundColor: '#009440', padding: 15 },

  card: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 15,
    marginBottom: 15
  },

  header: {
    flexDirection: 'row',
    marginBottom: 10
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
    color: '#555',
  },

  proposta: {
    backgroundColor: '#eee',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10
  },

  headerPartido: {
    flexDirection: 'row', // Alinha imagem e texto lado a lado
    alignItems: 'center', // Centraliza verticalmente
    paddingBottom: 10,
  },

  colunaImagem: {
    width: '25%', // Define que a imagem ocupa apenas 1/4 da largura
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoPartido: {
    width: 80,
    height: 80,
    borderRadius: 10,
    resizeMode: 'contain', // Garante que a logo não seja cortada
  },

  colunaTexto: {
    flex: 1, // Faz o texto ocupar todo o resto do espaço (3/4)
    paddingLeft: 15, // Espaçamento entre a imagem e o texto
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
});