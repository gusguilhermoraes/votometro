import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Animated } from 'react-native';
import { db } from '../../firebaseconfig';
import { collection, getDocs } from 'firebase/firestore';
import DropDownPicker from 'react-native-dropdown-picker';
import { Button, Chip, Searchbar, Snackbar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import * as Haptics from 'expo-haptics';

export default function PesquisaProjetosAvancada() {
  const router = useRouter();

  const [listas, setListas] = useState({
    anos: [], areasTematicas: [], estado: [], orgaos: [], temas: [], autores: []
  });

  const [filtros, setFiltros] = useState({
    nome: '', numero: '', autor: '', ano: '', areaTematica: '', estado: '', orgao: '', tema: ''
  });

  const [loading, setLoading] = useState(true);
  const [snackbarVisivel, setSnackbarVisivel] = useState(false);

  const [openAutor, setOpenAutor] = useState(false);
  const [openAno, setOpenAno] = useState(false);
  const [openTema, setOpenTema] = useState(false);
  const [openOrgao, setOpenOrgao] = useState(false);

  const shakeAnimation = useRef(new Animated.Value(0)).current;
  
  const { tema, coresAtuais } = useTheme();
  const isDarkMode = tema === 'escuro';

  useEffect(() => {
    let isMounted = true;

    const carregarDadosProjeto = async () => {
      try {
        // Otimização de Cache: Se já houver anos processados, pula a leitura do Firebase
        if (listas.anos.length > 0) {
          setLoading(false);
          return;
        }

        const snapProjetos = await getDocs(collection(db, 'projeto'));
        const dadosProjetos = snapProjetos.docs.map(doc => doc.data());

        const todosAutores = dadosProjetos.flatMap(p => 
          p.autores ? Object.values(p.autores).map(a => a.nome) : []
        );

        const todasAreas = dadosProjetos.flatMap(p => p.areaTematica || []);
        const todosTemas = dadosProjetos.flatMap(p => p.tema || []);

        if (isMounted) {
          setListas({
            anos: [...new Set(dadosProjetos.map(p => p.ano))].filter(Boolean).sort(),
            estado: [...new Set(dadosProjetos.map(p => p.estado))].filter(Boolean).sort(),
            orgaos: [...new Set(dadosProjetos.map(p => p.orgao))].filter(Boolean),
            autores: [...new Set(todosAutores)].filter(Boolean).sort(),
            areasTematicas: [...new Set(todasAreas)].filter(Boolean),
            temas: [...new Set(todosTemas)].filter(Boolean),
          });
        }
      } catch (error) {
        console.error("Erro ao carregar dados dos projetos:", error);
      } finally {
        if (isMounted) {
          setLoading(false); // Garante que o loading termine de forma segura
        }
      }
    };

    carregarDadosProjeto();

    return () => {
      isMounted = false; // Libera referências ao sair da tela
    };
  }, []);

  // Função que executa o "Chacoalhar" estilo Telegram
  const dispararShake = () => {
    // Sequência rápida de idas e voltas no eixo X
    Animated.sequence([
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };  

  const handlePesquisar = () => {
    const temFiltro = Object.values(filtros).some(val => val && val.trim() !== '');
    if (!temFiltro) {
      dispararShake();          // Ativa o feedback visual de erro na tela
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);  // Faz o celular vibrar
      setSnackbarVisivel(true); // Exibe o popup elegante vindo de baixo
      return;
    }
    router.push({ pathname: '/projetos/resultados', params: { ...filtros } });
  };

  if (loading) {
      return (
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: coresAtuais.primariaVerde }]}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={{ color: '#fff', marginTop: 10 }}>Carregando filtros...</Text>
        </View>
      );
    }

  const itensAnos = listas.anos.map(a => ({ label: a.toString(), value: a, key: a }));
  const itensAutores = listas.autores.map(a => ({ label: a, value: a, key: a }));
  const itensOrgaos = listas.orgaos.map(o => ({ label: o, value: o, key: o }));
  const itensTemas = listas.temas.map(t => ({ label: t, value: t, key: t }));

  return (
    <View style={{ flex: 1, backgroundColor: coresAtuais.primariaVerde }}>
      <Animated.ScrollView 
        style={[styles.container, { transform: [{ translateX: shakeAnimation }] }]}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
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
        <DropDownPicker
          open={openAno}
          value={filtros.ano}
          items={itensAnos}
          setOpen={setOpenAno}
          setValue={(callback) => setFiltros(prev => ({ ...prev, ano: callback(prev.ano) }))}
          placeholder="Selecione o ano"
          style={styles.dropdown}
          dropDownContainerStyle={styles.dropdownContainer}
          zIndex={openAno ? 1000 : 1}
          listMode="SCROLLVIEW"
        />

        <Text style={styles.label}>Autor</Text>
        <DropDownPicker
          open={openAutor}
          value={filtros.autor}
          items={itensAutores}
          setOpen={setOpenAutor}
          setValue={(callback) => setFiltros(prev => ({ ...prev, autor: callback(prev.autor) }))}
          placeholder="Selecione o(s) autor(es)"
          style={styles.dropdown}
          dropDownContainerStyle={styles.dropdownContainer}
          zIndex={openAutor ? 1000 : 1}
          listMode="SCROLLVIEW"
        />

        <Text style={styles.label}>Órgão</Text>
        <DropDownPicker
          open={openOrgao}
          value={filtros.orgao}
          items={itensOrgaos}
          setOpen={setOpenOrgao}
          setValue={(callback) => setFiltros(prev => ({ ...prev, orgao: callback(prev.orgao) }))}
          placeholder="Selecione o órgão"
          style={styles.dropdown}
          dropDownContainerStyle={styles.dropdownContainer}
          zIndex={openOrgao ? 1000 : 1}
          listMode="SCROLLVIEW"
        />

        <Text style={styles.label}>Tema</Text>
        <DropDownPicker
          open={openTema}
          value={filtros.tema}
          items={itensTemas}
          setOpen={setOpenTema}
          setValue={(callback) => setFiltros(prev => ({ ...prev, tema: callback(prev.tema) }))}
          placeholder="Selecione o tema"
          style={styles.dropdown}
          dropDownContainerStyle={styles.dropdownContainer}
          zIndex={openTema ? 1000 : 1}
          listMode="SCROLLVIEW"
        />

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
          Pesquisar
        </Button>
        <View style={{ height: 40 }} />
      </Animated.ScrollView>
      <Snackbar
        visible={snackbarVisivel}
        onDismiss={() => setSnackbarVisivel(false)}
        duration={3000}
        style={[
          styles.snackbar, 
          { backgroundColor: coresAtuais.snackbarFundo },
          isDarkMode && styles.snackbarNeonBorder
        ]}
        action={{
          label: 'OK',
          textColor: '#ff5252',
          onPress: () => setSnackbarVisivel(false),
        }}
      >
        <Text style={[styles.snackbarText, { color: coresAtuais.snackbarTexto }]}>Atenção: Selecione pelo menos um filtro para pesquisar.</Text>
      </Snackbar>      
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20, 
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
  },
  dropdown: { 
    backgroundColor: '#ffffff', 
    borderRadius: 25, 
    borderWidth: 0, 
    height: 50 
  },
  dropdownContainer: { 
    backgroundColor: '#ffffff', 
    borderRadius: 15, 
    borderWidth: 1, 
    borderColor: '#eee' 
  },
  snackbar: {
    backgroundColor: '#2b2b2b', // Cor escura do Telegram
    borderRadius: 12,
    position: 'absolute',       // Garante que ele flutue fixo na base
    bottom: 20,                 // Distância do final da tela
    left: 15,
    right: 15,
    elevation: 4,               // Sombra no Android
  },
  snackbarText: {
    color: '#fff',
    fontWeight: '500',
  },
  snackbarNeonBorder: {
    borderWidth: 0.8,           // Borda bem pequena/fina
    borderColor: '#91dbd6',
    // Opcional: Adiciona um leve brilho no Android/iOS se desejar
    shadowColor: '#91dbd6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
  }
});