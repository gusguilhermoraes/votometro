import React, { useEffect, useState, useMemo } from 'react'; // Adicione useMemo aqui
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { db } from '../../firebaseconfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Card, Avatar } from 'react-native-paper';
import { useTheme } from '@/context/ThemeContext';

export default function ResultadosParlamentares() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [parlamentares, setParlamentares] = useState([]);
  const [loading, setLoading] = useState(true);

  const filtroChave = useMemo(() => JSON.stringify(params), [params]);

  const { tema, coresAtuais } = useTheme();
  
  useEffect(() => {
    let isMounted = true; // Renomeado e unificado para segurança síncrona

    const buscar = async () => {
      try {
        setLoading(true);
        let ref = collection(db, 'parlamentar');
        let constraints = [];

        if (params.partido) constraints.push(where('partidoId', '==', params.partido));
        if (params.cargo) constraints.push(where('cargo', '==', params.cargo));
        if (params.local) constraints.push(where('local', '==', params.local));
        if (params.genero) constraints.push(where('genero', '==', params.genero));

        const q = query(ref, ...constraints);
        const snap = await getDocs(q);
        
        let lista = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        if (params.nome) {
          const termo = (params.nome as string).toLowerCase();
          lista = lista.filter(p => p.nome?.toLowerCase().includes(termo));
        }

        if (isMounted) {
          setParlamentares(lista);
        }
      } catch (e) {
        console.error("Erro na busca:", e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    buscar();

    return () => { isMounted = false; };
  }, [filtroChave]);

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: coresAtuais.primariaVerde }]}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: coresAtuais.primariaVerde }]}>
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
                  source={{ uri: item.fotoUrl || 'https://firebasestorage.googleapis.com/v0/b/votometro-adad1.firebasestorage.app/o/fotos_perfil%2Fusuario_padrao.png?alt=media&token=621ae248-d53d-4f9d-8305-400703a059be' }} 
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
  container: { 
    flex: 1 
  }, // Fundo verde constante
  center: { 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  card: { 
    margin: 10, 
    backgroundColor: '#fff', 
    borderRadius: 10 
  },
  empty: { 
    textAlign: 'center', 
    marginTop: 20, 
    color: '#fff', 
    fontWeight: 'bold' 
  }
});