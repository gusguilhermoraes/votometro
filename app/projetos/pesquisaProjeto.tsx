import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { db } from '../../firebaseconfig';
import { collection, getDocs } from 'firebase/firestore';
import { Picker } from '@react-native-picker/picker';
import { Button, Chip, Searchbar } from 'react-native-paper';
import { useRouter } from 'expo-router';

export default function PesquisaProjetosAvancada() {
  const router = useRouter();

  const [listas, setListas] = useState({
    anos: [], areasTematicas: [], estado: [], orgaos: [], temas: [], autores: []
  });

  const [filtros, setFiltros] = useState({
    nome: '',
    numero: '', // Novo campo texto
    autor: '',  // Novo campo seletor
    ano: '',
    areaTematica: '',
    estado: '',
    orgao: '',
    tema: ''
  });

  useEffect(() => {
    const carregarDadosProjeto = async () => {
      try {
        const snapProjetos = await getDocs(collection(db, 'projeto'));
        const dadosProjetos = snapProjetos.docs.map(doc => doc.data());

        // Extração de Autores (Lidando com o objeto autores: { autor1: { nome: ... } })
        const todosAutores = dadosProjetos.flatMap(p => 
          p.autores ? Object.values(p.autores).map(a => a.nome) : []
        );

        // Extração de Áreas e Temas (Lidando com Arrays/Listas)
        const todasAreas = dadosProjetos.flatMap(p => p.areaTematica || []);
        const todosTemas = dadosProjetos.flatMap(p => p.tema || []);

        setListas({
          anos: [...new Set(dadosProjetos.map(p => p.ano))].filter(Boolean).sort(),
          estado: [...new Set(dadosProjetos.map(p => p.estado))].filter(Boolean).sort(),
          orgaos: [...new Set(dadosProjetos.map(p => p.orgao))].filter(Boolean),
          autores: [...new Set(todosAutores)].filter(Boolean).sort(),
          areasTematicas: [...new Set(todasAreas)].filter(Boolean),
          temas: [...new Set(todosTemas)].filter(Boolean),
        });
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      }
    };

    carregarDadosProjeto();
  }, []);

  const handlePesquisar = () => {
    const temFiltro = Object.values(filtros).some(val => val && val.trim() !== '');
    if (!temFiltro) {
      Alert.alert('Atenção', 'Preencha ao menos um campo para pesquisar');
      return;
    }
    router.push({ pathname: '/projetos/resultados', params: { ...filtros } });
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>Nome do Projeto</Text>
      <Searchbar
        placeholder="Ex: Tarifa Zero..."
        value={filtros.nome}
        onChangeText={(t) => setFiltros({ ...filtros, nome: t })}
        style={styles.searchBar}
      />

      <Text style={styles.label}>Número do Projeto</Text>
      <Searchbar
        placeholder="Ex: 123"
        value={filtros.numero}
        onChangeText={(t) => setFiltros({ ...filtros, numero: t })}
        style={styles.searchBar}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Ano</Text>
      <View style={styles.seletor}>
        <Picker
          selectedValue={filtros.ano}
          onValueChange={(v) => setFiltros({ ...filtros, ano: v })}
        >
          <Picker.Item label="Todos os anos" value="" />
          {listas.anos.map(a => <Picker.Item key={a} label={a.toString()} value={a} />)}
        </Picker>
      </View>

      <Text style={styles.label}>Autor</Text>
      <View style={styles.seletor}>
        <Picker
          selectedValue={filtros.autor}
          onValueChange={(v) => setFiltros({ ...filtros, autor: v })}
        >
          <Picker.Item label="Todos os autores" value="" />
          {listas.autores.map(autor => <Picker.Item key={autor} label={autor} value={autor} />)}
        </Picker>
      </View>

      <Text style={styles.label}>Órgão</Text>
      <View style={styles.seletor}>
        <Picker
          selectedValue={filtros.orgao}
          onValueChange={(v) => setFiltros({ ...filtros, orgao: v })}
        >
          <Picker.Item label="Todos os órgãos" value="" />
          {listas.orgaos.map(o => <Picker.Item key={o} label={o} value={o} />)}
        </Picker>
      </View>

      <Text style={styles.label}>Tema</Text>
      <View style={styles.seletor}>
        <Picker
          selectedValue={filtros.tema}
          onValueChange={(v) => setFiltros({ ...filtros, tema: v })}
        >
          <Picker.Item label="Selecione o Tema" value="" />
          {listas.temas.map(t => <Picker.Item key={t} label={t} value={t} />)}
        </Picker>
      </View>

      <Text style={styles.label}>Área Temática</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chip}>
        {listas.areasTematicas.map(area => (
          <Chip
            key={area}
            selected={filtros.areaTematica === area}
            onPress={() => setFiltros({ ...filtros, areaTematica: filtros.areaTematica === area ? '' : area })}
            style={styles.chip}
          >
            {area}
          </Chip>
        ))}
      </ScrollView>

      <Text style={styles.label}>Status</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chip}>
        {listas.estado.map(est => (
          <Chip
            key={est}
            selected={filtros.estado === est}
            onPress={() => setFiltros({ ...filtros, estado: filtros.estado === est ? '' : est })}
            style={styles.chip}
          >
            {est}
          </Chip>
        ))}
      </ScrollView>

      <Button mode="contained" onPress={handlePesquisar} style={styles.btnPesquisar}>
        Pesquisar Projeto
      </Button>
      <View style={{ height: 40 }} />
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
    marginTop: 20,
    marginBottom: 40
  },
  seletor: { 
    backgroundColor: '#ffffff',
    borderRadius: 50,
    paddingLeft: 10,
    marginTop: 8
  }
});