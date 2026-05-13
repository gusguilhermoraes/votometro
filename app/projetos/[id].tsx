import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { db } from '../../firebaseconfig';
import { doc, getDoc } from 'firebase/firestore';
import { Card, Button, IconButton } from 'react-native-paper';

export default function DetalhesProjeto() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const [projeto, setProjeto] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const carregar = async () => {
      try {
        setLoading(true);

        const docRef = doc(db, 'candidatos', id as string);
        const docSnap = await getDoc(docRef);

        if (!active) return;

        if (docSnap.exists()) {
          const data = docSnap.data();

          setCandidato(data);

          if (data.partidoId) {
            const partidoRef = doc(db, 'partidos', data.partidoId);
            const partidoSnap = await getDoc(partidoRef);

            if (!active) return;

            if (partidoSnap.exists()) {
              setPartido(partidoSnap.data());
            }
          }

          const propostasSnap = await getDocs(
            collection(db, `candidatos/${id}/propostas`)
          );

          if (!active) return;

          setPropostas(
            propostasSnap.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }))
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    carregar();

    return () => {
      active = false;
    };
  }, [id]);

  if (loading) return <ActivityIndicator style={styles.center} size="large" color="#fff" />;

  // Extração dos nomes dos autores do objeto 'autores'
  const nomesAutores = projeto?.autores 
    ? Object.values(projeto.autores).map(a => a.nome).join(', ') 
    : 'Não informado';

  return (
    <>

    <Stack.Screen 
      options={{ 
        title: `PL ${projeto?.numero}/${projeto?.ano}`,
        headerStyle: {
          backgroundColor: "#009440",
        },
        headerTintColor: "black",
        headerTitleAlign: "center",
      }} 
    />

    <ScrollView style={styles.container}>
      {/* CARD 1: Detalhes do Projeto */}
      <Card style={styles.cardPrincipal}>
        <Card.Content>
          <Text style={styles.tituloProjeto}>{projeto?.nome}</Text>
          <Text style={styles.label}>Nº do Projeto: <Text style={styles.valor}>{projeto?.numero}</Text></Text>
          <Text style={styles.label}>Ano de criação do Projeto: <Text style={styles.valor}>{projeto?.ano}</Text></Text>
          <Text style={styles.label}>Órgão de origem do Projeto: <Text style={styles.valor}>{projeto?.orgao}</Text></Text>
          
          <Text style={styles.secaoTitulo}>Descrição:</Text>
          <Text style={styles.descricao}>{projeto?.descricao}</Text>

          <Text style={styles.label}>Situação: <Text style={styles.valor}>{projeto?.estado}</Text></Text>
          
          <Text style={styles.label}>Área temática: 
            <Text style={styles.valor}> {Array.isArray(projeto?.areaTematica) ? projeto.areaTematica.join(', ') : projeto?.areaTematica}</Text>
          </Text>
        </Card.Content>
      </Card>

      {/* CARD 2: Autor(es) - Separado conforme solicitado */}
      <Text style={[styles.secaoTitulo, { color: '#fff', marginLeft: 15, fontSize: 18 }]}>
      Autoria
    </Text>

    {projeto?.autores && Object.entries(projeto.autores).map(([key, autor]) => (
      <Card 
        key={key} 
        style={styles.cardSecundario} 
        onPress={() => router.push(`/politicos/${autor.idPolitico}`)} // Ajuste a rota conforme sua estrutura
      >
        <Card.Title 
          title={autor.nome} 
          titleStyle={styles.cardTitle}
          subtitle={projeto?.orgao}
          right={(props) => <IconButton {...props} icon="chevron-right" />}
        />
      </Card>
    ))}

      {/* CARD 3: Enquete (Espaço reservado para criação posterior) */}
      <Card style={styles.cardSecundario}>
        <Card.Content>
          <Text style={styles.perguntaEnquete}>Você apoia essa proposta?</Text>
          <View style={styles.areaBotoes}>
            <Button mode="contained" buttonColor="#2b47f2" style={styles.btnEnquete} onPress={() => {}}>Sim</Button>
            <Button mode="contained" buttonColor="#2b47f2" style={styles.btnEnquete} onPress={() => {}}>Não</Button>
            <Button mode="contained" buttonColor="#2b47f2" style={styles.btnEnquete} onPress={() => {}}>Parcialmente</Button>
          </View>
        </Card.Content>
      </Card>

      <View style={{ height: 40 }} />
    </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#009440', padding: 15 },
  center: { flex: 1, justifyContent: 'center', backgroundColor: '#009440' },
  cardPrincipal: { borderRadius: 20, marginBottom: 15, paddingVertical: 10 },
  cardSecundario: { borderRadius: 20, marginBottom: 15 },
  tituloProjeto: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 15, color: '#000' },
  label: { fontWeight: 'bold', marginTop: 10, color: '#333' },
  valor: { fontWeight: 'normal', color: '#555' },
  secaoTitulo: { fontWeight: 'bold', marginTop: 15 },
  descricao: { textAlign: 'justify', color: '#444', lineHeight: 20, marginTop: 5 },
  cardTitle: { fontSize: 18, fontWeight: 'bold' },
  valorAutor: { fontSize: 16, color: '#000' },
  orgaoText: { fontSize: 12, color: '#666', marginTop: 4 },
  perguntaEnquete: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginVertical: 10 },
  areaBotoes: { gap: 10, marginTop: 10 },
  btnEnquete: { borderRadius: 8 },
  cardSecundario: { 
    borderRadius: 15, // Arredondamento um pouco menor para cards em lista
    marginBottom: 10, 
    elevation: 2 
  },
  secaoTitulo: { 
    fontWeight: 'bold', 
    marginTop: 15, 
    marginBottom: 10 
  }
});