import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Linking, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { db } from '../../../../firebaseconfig';
import { doc, getDoc } from 'firebase/firestore';
import { Card, Button } from 'react-native-paper';
import { useTheme } from '@/context/ThemeContext';

export default function DetalheProposta() {
  const { candidatoId, propostaId } = useLocalSearchParams();

  const [proposta, setProposta] = useState(null);
  const [loading, setLoading] = useState(true);

  const { coresAtuais } = useTheme();

  useEffect(() => {
    let isMounted = true; // Trava de concorrência inicializada

    const buscarProposta = async () => {
      try {
        setLoading(true);
        const ref = doc(
          db,
          `candidatos/${candidatoId}/propostas/${propostaId}`
        );

        const snap = await getDoc(ref);

        if (snap.exists() && isMounted) {
          setProposta(snap.data());
        }
      } catch (error) {
        console.error('Erro ao buscar proposta:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (candidatoId && propostaId) {
      buscarProposta();
    }

    return () => {
      isMounted = false; // Desativa re-renders se o usuário voltar para a lista
    };
  }, [candidatoId, propostaId]);

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 50 }} size="large" color="#fff" />;
  }

  if (!proposta) {
    return <Text>Proposta não encontrada</Text>;
  }

  return (
    <>
    <Stack.Screen 
      options={{ 
        title: `Proposta`, // Aqui você usa o ID no título
        headerStyle: {
          backgroundColor: coresAtuais.primariaVerde
        },
        headerTintColor: coresAtuais.texto,
        headerTitleAlign: "center",
      }} 
    />
    <ScrollView style={[styles.container, { backgroundColor: coresAtuais.primariaVerde }]}>

      <Card style={styles.card}>

        <Text style={styles.titulo}>
          Proposta: {proposta.nome}
        </Text>

        <Text style={styles.descricao}>
          Descrição: {proposta.descricao}
        </Text>

        <View style={styles.fonteContainer}>
          <Text style={styles.fonte}>
            Fonte: {proposta.fonteNome || 'Não informada'} (
          </Text>
          {proposta.fonteUrl && (
            <TouchableOpacity onPress={() => Linking.openURL(proposta.fonteUrl)}>
              <Text style={styles.linkTexto}>acessar</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.fonte}>
            )
          </Text>
        </View>

        <Text style={styles.temas}>
          Área temática: {proposta.tema?.join(', ')}
        </Text>

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

  fonteContainer: {
    flexDirection: 'row', // Faz o (acessar) ficar ao lado do texto
    alignItems: 'center',
    marginTop: 10,
    flexWrap: 'wrap',
  },

  fonte: {
    marginBottom: 10,
    color: '#555'
  },

  linkTexto: {
    fontSize: 14,
    color: '#007bff',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },

  temas: {
    marginTop: 15,
    color: '#555'
  }
});