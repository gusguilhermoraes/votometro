import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { db } from '../../firebaseconfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Card, IconButton } from 'react-native-paper';

export default function ResultadosProjetos() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Captura dos novos parâmetros enviados pela pesquisa
  const { nome, numero, autor, ano, areaTematica, estado, orgao, tema } = params;

  const [projetos, setProjetos] = useState([]);
  const [loading, setLoading] = useState(true);

  const buscarProjetos = async () => {
    try {
      setLoading(true);
      let ref = collection(db, 'projeto'); // Alterado para a coleção 'projeto'
      let constraints: any[] = [];

      // Filtros diretos no Firebase
      if (ano) constraints.push(where('ano', '==', ano));
      if (estado) constraints.push(where('estado', '==', estado));
      if (orgao) constraints.push(where('orgao', '==', orgao));
      if (numero) constraints.push(where('numero', '==', numero));
      
      // Como areaTematica é um Array na sua coleção, usamos array-contains
      if (areaTematica) {
        constraints.push(where('areaTematica', 'array-contains', areaTematica));
      }

      const q = constraints.length > 0 ? query(ref, ...constraints) : ref;
      const snapshot = await getDocs(q);

      let lista = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Filtros manuais (para campos dentro de objetos ou busca parcial por texto)
      if (nome) {
        lista = lista.filter(p =>
          p.nome?.toLowerCase().includes((nome as string).toLowerCase())
        );
      }

      if (autor) {
        // Filtra se o nome do autor selecionado existe em qualquer um dos autores (autor1, autor2...)
        lista = lista.filter(p => 
          p.autores && Object.values(p.autores).some((a: any) => a.nome === autor)
        );
      }

      setProjetos(lista);
    } catch (error) {
      console.error("Erro ao buscar projetos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    buscarProjetos();
    console.log(params);
  }, [nome, numero, autor, ano, areaTematica, estado, orgao, tema]); // Recarrega se os parâmetros mudarem

  if (loading) {
    return <ActivityIndicator size="large" color="#fff" style={{ marginTop: 50 }} />;
  }

  return (
    <FlatList
      style={styles.container}
      data={projetos}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <Card 
          style={styles.card} 
          onPress={() => router.push(`/projetos/${item.id}`)}
        >
          <Card.Title
            title={item.nome}
            subtitle={`PL ${item.numero}/${item.ano} | ${item.orgao}`}
            left={(props) => <IconButton {...props} icon="file-document-outline" />}
          />
          <Card.Content>
            <Text numberOfLines={2} style={styles.descricao}>
              {item.descricao}
            </Text>
            <Text style={styles.status}>Status: {item.estado}</Text>
          </Card.Content>
        </Card>
      )}
      ListEmptyComponent={
        <Text style={styles.empty}>Nenhum projeto encontrado com esses filtros.</Text>
      }
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
  descricao: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5
  },
  status: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000000'
  },
  empty: { 
    textAlign: 'center', 
    marginTop: 20 
  }
});