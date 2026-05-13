import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator, TouchableOpacity, Linking } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { db } from '../../firebaseconfig';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { Card, Button } from 'react-native-paper';
import { FontAwesome6 } from '@expo/vector-icons';

export default function DetalhesParlamentar() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [parlamentar, setParlamentar] = useState(null);
  const [partido, setPartido] = useState(null);
  const [discursos, setDiscursos] = useState([]);
  const [loading, setLoading] = useState(true);

  const buscarDados = async () => {
    try {
      setLoading(true);

      // 🔹 Busca dados do parlamentar (Coleção correta: parlamentar)
      const docRef = doc(db, 'parlamentar', id as string);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
         
        // Tratamento de Data de Nascimento (Timestamp do Firebase)
        const dataNascFormatada = data.dataNasc?.toDate 
          ? data.dataNasc.toDate().toLocaleDateString('pt-BR') 
          : 'Não informada';

        setParlamentar({ ...data, dataNascFormatada });

        // 🔹 Busca dados do partido
        if (data.partidoId) {
          const partidoRef = doc(db, 'partidos', data.partidoId);
          const partidoSnap = await getDoc(partidoRef);
          if (partidoSnap.exists()) setPartido(partidoSnap.data());
        }

        // 🔹 Busca subcoleção de Discursos (Antigas propostas)
        const discursosSnap = await getDocs(collection(db, `parlamentar/${id}/discursos`));
        setDiscursos(discursosSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    } catch (error) {
      console.error("Erro ao buscar detalhes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) buscarDados();
  }, [id]);
  
  if (loading) {
    return <ActivityIndicator style={{ marginTop: 50 }} />;
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
          backgroundColor: "#009440",
        },
        headerTintColor: "black",
        headerTitleAlign: "center",
      }} 
    />

    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <Image
            source={{ uri: parlamentar.fotoUrl || `https://i.pravatar.cc/100?u=${parlamentar?.genero || 'usuario'}` }}
            style={styles.avatar}
          />
          <View style={styles.headerText}>
            <Text style={styles.nomeParlamentar}>{parlamentar.nome}</Text>
            <Text style={styles.subtitulo}>{parlamentar.cargo}(a) - {parlamentar.local}</Text>
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.label}>Nome Completo:</Text>
          <Text style={styles.valor}>{parlamentar.nomeCompleto}</Text>
          
          <Text style={styles.label}>Partido:</Text>
          <Text style={styles.valor}>{partido?.sigla} - {partido?.nome}</Text>

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

      <Card style={styles.card}>
        <Text style={styles.tituloSecao}>Discursos e Atuações</Text>
        {discursos.length > 0 ? discursos.map((d) => (
          <TouchableOpacity key={d.id} style={styles.itemLista} onPress={() => router.push(`/politicos/discurso/${id}/${d.id}`)}>
            <Text style={styles.itemTexto}>{d.titulo || 'Discurso sem título'}</Text>
          </TouchableOpacity>
        )) : <Text>Nenhum discurso registrado.</Text>}
      </Card>
    </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#009440', padding: 10 },
  card: { padding: 15, borderRadius: 12, marginBottom: 10, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  headerText: { marginLeft: 15 },
  nomeParlamentar: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  subtitulo: { fontSize: 14, color: '#666' },
  infoSection: { marginTop: 10 },
  label: { fontWeight: 'bold', color: '#009440', marginTop: 8 },
  valor: { fontSize: 15, color: '#444' },
  tituloSecao: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  itemLista: { paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: '#ccc' },
  itemTexto: { color: '#005da3' },
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
});