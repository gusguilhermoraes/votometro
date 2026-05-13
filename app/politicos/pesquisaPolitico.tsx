import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { db } from '../../firebaseconfig';
import { collection, getDocs } from 'firebase/firestore';
import { Picker } from '@react-native-picker/picker';
import { Button, Chip, Searchbar } from 'react-native-paper';
import { useRouter } from 'expo-router';

export default function PesquisaParlamentar() {
  const router = useRouter();
  const [listas, setListas] = useState({ partidos: [], cargos: [], locais: [], formacoes: [] });
  const [filtros, setFiltros] = useState({ nome: '', partido: '', cargo: '', local: '', formacao: '', genero: '' });

  useEffect(() => {
    const carregarFiltros = async () => {
      const snapPartidos = await getDocs(collection(db, 'partidos'));
      const listaPartidos = snapPartidos.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const snapParlamentar = await getDocs(collection(db, 'parlamentar'));
      const dados = snapParlamentar.docs.map(doc => doc.data());

      setListas({
        partidos: listaPartidos,
        cargos: [...new Set(dados.map(d => d.cargo))].filter(Boolean),
        locais: [...new Set(dados.map(d => d.local))].filter(Boolean),
        formacoes: [...new Set(dados.map(d => d.formacao))].filter(Boolean),
      });
    };
    carregarFiltros();
  }, []);

  const handlePesquisar = () => {
    const temFiltro =
      filtros.nome?.trim() ||
      filtros.partido ||
      filtros.cargo ||
      filtros.genero ||
      filtros.local?.trim();
  
    if (!temFiltro) {
      Alert.alert('Atenção', 'Selecione pelo menos um filtro');
      return;
    }
  
    router.push({
      pathname: '/politicos/resultados',
      params: {
        nome: filtros.nome || '',
        partido: filtros.partido || '',
        cargo: filtros.cargo || '',
        local: filtros.local || '',
        genero: filtros.genero || ''
      }
    });
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>Nome</Text>
      <Searchbar
        placeholder="Nome do candidato"
        value={filtros.nome}
        onChangeText={(t) => setFiltros({ ...filtros, nome: t })}
        style={styles.searchBar}
      />

      <Text style={styles.label}>Partido</Text>
      <View style={styles.seletor}>
        <Picker
          selectedValue={filtros.partido}
          onValueChange={(v) => setFiltros({ ...filtros, partido: v })}
        >
          <Picker.Item label="Todos os Partidos" value="" />
          {listas.partidos.map(p => (
            <Picker.Item key={p.id} label={`${p.sigla} - ${p.nome}`} value={p.id} />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>Cargo</Text>
      <View style={styles.seletor}>
        <Picker selectedValue={filtros.cargo} onValueChange={(v) => setFiltros({ ...filtros, cargo: v })}>
          <Picker.Item label="Todos os cargos" value="" />
          {listas.cargos.map(c => <Picker.Item key={c} label={c} value={c} />)}
        </Picker>
      </View>

      <Text style={styles.label}>Estado/Local</Text>
      <View style={styles.seletor}>
        <Picker selectedValue={filtros.local} onValueChange={(v) => setFiltros({ ...filtros, local: v })}>
          <Picker.Item label="Todos os locais" value="" />
          {listas.locais.map(l => <Picker.Item key={l} label={l} value={l} />)}
        </Picker>
      </View>

      <Text style={styles.label}>Gênero</Text>
      <View style={styles.seletor}>
        <Picker selectedValue={filtros.genero} onValueChange={(v) => setFiltros({ ...filtros, genero: v })}>
          <Picker.Item label="Todos" value="" />
          <Picker.Item label="Masculino" value="Masculino" />
          <Picker.Item label="Feminino" value="Feminino" />
        </Picker>
      </View>

      <Button mode="contained" onPress={handlePesquisar} style={styles.btnPesquisar}>
        Pesquisar
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20, 
    backgroundColor: '#009440' 
  },
  label: { 
    color: '#fff', 
    marginTop: 10 
  },
  searchBar: { 
    marginBottom: 10 
  },
  chip: { 
    marginRight: 5 
  },
  btnPesquisar: { 
    marginTop: 20 
  },
  seletor: { 
    backgroundColor: '#ffffff',
    borderRadius: 50,
    paddingLeft: 10,
    marginTop: 8
  },
});