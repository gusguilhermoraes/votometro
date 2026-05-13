import React, { useEffect, useState, useMemo } from 'react'; // Adicione useMemo aqui
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { db } from '../../firebaseconfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Card, Avatar } from 'react-native-paper';

export default function ResultadosParlamentares() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [parlamentares, setParlamentares] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. ESTABILIZAÇÃO: Transformamos os params em uma string estável no TOPO do componente
  const filtroChave = useMemo(() => JSON.stringify(params), [params]);

  useEffect(() => {
    let montado = true;

    const buscar = async () => {
      try {
        setLoading(true);
        let ref = collection(db, 'parlamentar');
        let constraints = [];

        // Filtros de Query do Firestore
        if (params.partido) constraints.push(where('partidoId', '==', params.partido));
        if (params.cargo) constraints.push(where('cargo', '==', params.cargo));
        if (params.local) constraints.push(where('local', '==', params.local));
        if (params.genero) constraints.push(where('genero', '==', params.genero));

        const q = query(ref, ...constraints);
        const snap = await getDocs(q);
        
        let lista = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // 2. FILTRO DE NOME: Feito manualmente no código (Client-side)
        if (params.nome) {
          const termo = (params.nome as string).toLowerCase();
          lista = lista.filter(p => p.nome?.toLowerCase().includes(termo));
        }

        if (montado) {
          setParlamentares(lista);
        }
      } catch (e) {
        console.error("Erro na busca:", e);
      } finally {
        if (montado) setLoading(false);
      }
    };

    buscar();

    // Função de limpeza para evitar o "memory leak" e a piscada
    return () => { montado = false; };
  }, [filtroChave]); // 3. DEPENDÊNCIA: Usamos a string estável aqui

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={parlamentares}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 20 }}
        initialNumToRender={8} // Renderiza poucos primeiro
        windowSize={5} // Mantém apenas o que está perto da visão na memória
        maxToRenderPerBatch={5}
        removeClippedSubviews={true} // Descarrega o que saiu da tela
        renderItem={({ item }) => (
          <Card 
            style={styles.card} 
            onPress={() => router.push(`/politicos/${item.id}`)}
          >
            <Card.Title
              title={item.nome}
              subtitle={`${item.cargo} - ${item.local}`}
              left={() => (
                <Avatar.Image 
                  size={45} 
                  source={{ uri: item.fotoUrl || 'https://via.placeholder.com/150' }} 
                />
              )}
            />
          </Card>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>Nenhum parlamentar encontrado.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#009440' }, // Fundo verde constante
  center: { justifyContent: 'center', alignItems: 'center' },
  card: { margin: 10, backgroundColor: '#fff', borderRadius: 10 },
  empty: { textAlign: 'center', marginTop: 20, color: '#fff', fontWeight: 'bold' }
});