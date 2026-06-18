import React, { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { db } from '../../firebaseconfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Card, Avatar } from 'react-native-paper';
import { useTheme } from '@/context/ThemeContext';

export default function ResultadosCandidatos() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const nome = params.nome || '';
  const partido = params.partido || '';
  const cargo = params.cargo || '';
  const local = params.local || '';
  const ocupacao = params.ocupacao || '';
  const instrucao = params.instrucao || '';
  const formacao = params.formacao || '';

  const temasArray = params.temasSelecionados
    ? JSON.parse(params.temasSelecionados as string)
    : [];

  const [navigating, setNavigating] = useState(false);
  const [candidatos, setCandidatos] = useState([]);
  const [loading, setLoading] = useState(true);

  const { coresAtuais, tema } = useTheme();
  const isDarkMode = tema === 'escuro';

  useEffect(() => {
    let isMounted = true; // Trava de segurança local e síncrona instalada

    const buscarCandidatos = async () => {
      try {
        setLoading(true);

        let ref = collection(db, 'candidatos');
        let constraints: any[] = [];

        if (partido) constraints.push(where('partidoId', '==', partido));
        if (cargo) constraints.push(where('cargo', '==', cargo));
        if (local) constraints.push(where('localCargo', '==', local));
        if (ocupacao) constraints.push(where('ocupacao', '==', ocupacao));
        if (instrucao) constraints.push(where('instrucao', '==', instrucao));
        if (formacao) constraints.push(where('formacao', '==', formacao));

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
            c.nomeUrna?.toLowerCase().includes((nome as string).toLowerCase())
          );
        }

        // Só altera o estado e aloca memória se o componente ainda existir na tela
        if (isMounted) {
          setCandidatos(lista);
        }

      } catch (error) {
        console.error("Erro ao carregar resultados de candidatos:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    buscarCandidatos(); 

    return () => { 
      isMounted = false; // Cancela qualquer re-render de processo pendente ao sair da tela
    };
  }, [params.nome, params.partido, params.cargo, params.local, params.instrucao, params.ocupacao, params.formacao, params.temasSelecionados]);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: coresAtuais.primariaVerde }]}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
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
        style={[
          styles.container, 
          { backgroundColor: coresAtuais.primariaVerde }
        ]}
        data={candidatos}
        keyExtractor={(item) => item.id}
        initialNumToRender={10} // Carrega poucos itens inicialmente
        windowSize={5} // Mantém apenas o que está perto da visão na memória
        maxToRenderPerBatch={5} // Renderiza em blocos pequenos
        removeClippedSubviews={true} // Libera memória de itens fora da tela
        renderItem={({ item }) => (
          <Card 
            style={[
              styles.card,
              isDarkMode && styles.neonBorder
            ]} 
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
  },
  card: { 
    margin: 10 
  },
  empty: { 
    textAlign: 'center', 
    marginTop: 20 
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