import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { db } from '../../firebaseconfig';
import { collection, getDocs } from 'firebase/firestore';
import { Picker } from '@react-native-picker/picker';
import { Button, Chip, Searchbar } from 'react-native-paper';
import { useRouter } from 'expo-router';

export default function PesquisaAvancada() {
  const router = useRouter();

  const [listas, setListas] = useState({
    partidos: [], cargos: [], cidades: [], ocupacoes: [], formacoes: [], instrucoes: [], temas: []
  });

  const [filtros, setFiltros] = useState({
    nome: '', partido: '', cargo: '', cidade: '', ocupacao: '', formacao: '', instrucao: '', temasSelecionados: []
  });

  useEffect(() => {
    const carregarDadosFiltros = async () => {
      const snapPartidos = await getDocs(collection(db, 'partidos'));
      const partidos = snapPartidos.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const snapCandidatos = await getDocs(collection(db, 'candidatos'));
      const dadosCands = snapCandidatos.docs.map(doc => doc.data());

      const todosTemas = dadosCands.flatMap(c => c.temasResumo || []);
      const temasUnicos = [...new Set(todosTemas)].filter(Boolean);

      setListas({
        partidos,
        cargos: [...new Set(dadosCands.map(c => c.cargo))].filter(Boolean),
        cidades: [...new Set(dadosCands.map(c => c.localCargo))].filter(Boolean),
        ocupacoes: [...new Set(dadosCands.map(c => c.ocupacao))].filter(Boolean),
        formacoes: [...new Set(dadosCands.map(c => c.formacao))].filter(Boolean),
        instrucoes: [...new Set(dadosCands.map(c => c.instrucao))].filter(Boolean),
        temas: temasUnicos
      });
    };

    carregarDadosFiltros();
  }, []);

  const toggleTema = (tema) => {
    setFiltros(prev => {
      const jaSelecionado = prev.temasSelecionados.includes(tema);
      return {
        ...prev,
        temasSelecionados: jaSelecionado
          ? prev.temasSelecionados.filter(t => t !== tema)
          : [...prev.temasSelecionados, tema]
      };
    });
  };

  const handlePesquisar = () => {
    const temFiltro =
      filtros.nome?.trim() ||
      filtros.partido ||
      filtros.cargo ||
      filtros.cidade?.trim() ||
      (filtros.temasSelecionados && filtros.temasSelecionados.length > 0);

    if (!temFiltro) {
      Alert.alert('Atenção', 'Selecione pelo menos um filtro');
      return;
    }

    router.push({
      pathname: '/candidatos/resultados',
      params: {
        nome: filtros.nome || '',
        partido: filtros.partido || '',
        cargo: filtros.cargo || '',
        local: filtros.cidade || '',
        temasSelecionados: JSON.stringify(filtros.temasSelecionados || [])
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
        <Picker
          selectedValue={filtros.cargo}
          onValueChange={(v) => setFiltros({ ...filtros, cargo: v })}
        >
          <Picker.Item label="Selecione o Cargo" value="" />
          {listas.cargos.map(c => <Picker.Item key={c} label={c} value={c} />)}
        </Picker>
      </View>

      <Text style={styles.label}>Cidade</Text>
      <View style={styles.seletor}>
        <Picker
          selectedValue={filtros.cidade}
          onValueChange={(v) => setFiltros({ ...filtros, cidade: v })}
        >
          <Picker.Item label="Selecione a Cidade" value="" />
          {listas.cidades.map(c => <Picker.Item key={c} label={c} value={c} />)}
        </Picker>
      </View>

      <Text style={styles.label}>Temas</Text>
      <ScrollView horizontal>
        {listas.temas.map(tema => (
          <Chip
            key={tema}
            selected={filtros.temasSelecionados.includes(tema)}
            onPress={() => toggleTema(tema)}
            style={styles.chip}
          >
            {tema}
          </Chip>
        ))}
      </ScrollView>

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
  }
});