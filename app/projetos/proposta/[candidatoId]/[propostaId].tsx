import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Linking } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { db } from '../../../../firebaseconfig';
import { doc, getDoc } from 'firebase/firestore';
import { Card, Button } from 'react-native-paper';

export default function DetalheProposta() {
  const { candidatoId, propostaId } = useLocalSearchParams();

  const [proposta, setProposta] = useState(null);
  const [loading, setLoading] = useState(true);

  const buscarProposta = async () => {
    try {
      setLoading(true);

      const ref = doc(
        db,
        `candidatos/${candidatoId}/propostas/${propostaId}`
      );

      const snap = await getDoc(ref);

      if (snap.exists()) {
        setProposta(snap.data());
      }

    } catch (error) {
      console.error('Erro ao buscar proposta:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (candidatoId && propostaId) {
      buscarProposta();
    }
  }, [candidatoId, propostaId]);

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 50 }} />;
  }

  if (!proposta) {
    return <Text>Proposta não encontrada</Text>;
  }

  console.log(candidatoId);
  console.log(propostaId);
  return (
    <ScrollView style={styles.container}>

      <Card style={styles.card}>

        <Text style={styles.titulo}>
          Proposta: {proposta.titulo}
        </Text>

        <Text style={styles.descricao}>
          {proposta.descricao}
        </Text>

        <Text style={styles.fonte}>
          Fonte: {proposta.fonte || 'Não informada'}
        </Text>

        {proposta.link && (
          <Button
            mode="contained"
            onPress={() => Linking.openURL(proposta.link)}
          >
            Acessar
          </Button>
        )}

        <Text style={styles.temas}>
          Área temática: {proposta.temas?.join(', ')}
        </Text>

      </Card>

    </ScrollView>
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
    padding: 20,
    borderRadius: 15
  },

  titulo: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center'
  },

  descricao: {
    fontSize: 14,
    marginBottom: 15,
    lineHeight: 20
  },

  fonte: {
    marginBottom: 10,
    fontStyle: 'italic'
  },

  temas: {
    marginTop: 15,
    color: '#555'
  }
});