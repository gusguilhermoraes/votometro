import React, { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { db } from '../../firebaseconfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Card, Avatar } from 'react-native-paper';

export default function ResultadosCandidatos() {
  const router = useRouter();

  const params = useLocalSearchParams();

  const nome = params.nome || '';
  const partido = params.partido || '';
  const cargo = params.cargo || '';
  const local = params.local || '';

  const temasArray = params.temasSelecionados
    ? JSON.parse(params.temasSelecionados as string)
    : [];

  const [navigating, setNavigating] = useState(false);
  const [candidatos, setCandidatos] = useState([]);
  const [loading, setLoading] = useState(true);

  const isMounted = useRef(true);

  const buscarCandidatos = async () => {
    try {
      setLoading(true);

      let ref = collection(db, 'candidatos');
      let constraints: any[] = [];

      if (partido) constraints.push(where('partidoId', '==', partido));
      if (cargo) constraints.push(where('cargo', '==', cargo));
      if (local) constraints.push(where('localCargo', '==', local));

      if (temasArray.length > 0) {
        constraints.push(where('temas_resumo', 'array-contains-any', temasArray));
      }

      const q = constraints.length > 0 ? query(ref, ...constraints) : ref;
      const snapshot = await getDocs(q);

      let lista = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      if (nome) {
        lista = lista.filter(c =>
          c.nomeUrna?.toLowerCase().includes(nome.toLowerCase())
        );
      }

      if (isMounted.current) {
        setCandidatos(lista);
      }

    } catch (error) {
      console.error(error);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    isMounted.current = true;
    buscarCandidatos(); 

    return () => { 
      isMounted.current = false; // Aqui ele mata processos pendentes ao sair da tela
    };
  }, [params.nome, params.partido, params.cargo, params.local, params.temasSelecionados]);

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 50 }} />;
  }

  const abrirDetalhes = (id: string) => {
    if (navigating) return;

    setNavigating(true);

    router.push(`/candidatos/${id}`);

    setTimeout(() => {
      setNavigating(false);
    }, 1000);
  };


  return (
      <FlatList
        style={styles.container}
        data={candidatos}
        keyExtractor={(item) => item.id}
        initialNumToRender={10} // Carrega poucos itens inicialmente
        windowSize={5} // Mantém apenas o que está perto da visão na memória
        maxToRenderPerBatch={5} // Renderiza em blocos pequenos
        removeClippedSubviews={true} // Libera memória de itens fora da tela
        renderItem={({ item }) => (
          <Card 
            style={styles.card} 
            onPress={() => abrirDetalhes(item.id)}
          >
            <Card.Title
              title={item?.nomeUrna || 'Sem nome'}
              subtitle={`${item?.cargo || 'Sem cargo'} - ${item?.localCargo || 'Sem local'}`}
              left={() => (
                <Avatar.Image
                  size={40}
                  source={{ uri: item.fotoUrl || `https://i.pravatar.cc/100?u=${item?.genero || 'usuario'}` }}
                />
              )}
            />
          </Card>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Nenhum resultado encontrado</Text>}
      />
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20, 
    backgroundColor: '#009440' 
  },
  card: { 
    margin: 10 
  },
  empty: { 
    textAlign: 'center', 
    marginTop: 20 
  }
});