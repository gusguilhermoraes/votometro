import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Animated } from 'react-native';
import { db } from '../../firebaseconfig';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import DropDownPicker from 'react-native-dropdown-picker';
import { Button, Chip, Searchbar, Snackbar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import * as Haptics from 'expo-haptics';

export default function PesquisaAvancada() {
  const router = useRouter();

  const shakeAnimation = useRef(new Animated.Value(0)).current;

  const [listas, setListas] = useState({
    partidos: [], cargos: [], cidades: [], ocupacoes: [], formacoes: [], instrucoes: [], temas: []
  });

  const [filtros, setFiltros] = useState({
    nome: '', partido: '', cargo: '', cidade: '', ocupacao: '', formacao: '', instrucao: '', temasSelecionados: []
  });

  // Adicionado: Estado de carregamento
  const [loading, setLoading] = useState(true);
  const [snackbarVisivel, setSnackbarVisivel] = useState(false);

  const [openPartido, setOpenPartido] = useState(false);
  const [openCargo, setOpenCargo] = useState(false);
  const [openCidade, setOpenCidade] = useState(false);
  const [openOcupacao, setOpenOcupacao] = useState(false);
  const [openFormacao, setOpenFormacao] = useState(false);
  const [openInstrucao, setOpenInstrucao] = useState(false);

  const { tema, coresAtuais } = useTheme();
  const isDarkMode = tema === 'escuro';

  useEffect(() => {
    let isMounted = true;

    const carregarDadosFiltros = async () => {
      try {
        // Otimização de Cache local
        if (listas.partidos.length > 0) {
          setLoading(false);
          return;
        }

        // 1. Busca os partidos (continua igual, pois estão em coleção separada)
        const snapPartidos = await getDocs(collection(db, 'partidos'));
        const partidos = snapPartidos.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // 2. BUSCA O DOCUMENTO DE METADADOS (Substituindo a leitura de candidatos)
        const docRef = doc(db, 'metadados', 'filtrosCandidatos');
        const snapMetadados = await getDoc(docRef);

        if (snapMetadados.exists() && isMounted) {
          const dadosFiltros = snapMetadados.data();

          // Função auxiliar para ordenar tratando acentos locais
          const ordenar = (array: string[]) => {
            return (array || []).slice().sort((a, b) => a.localeCompare(b, 'pt-BR'));
          };

          setListas({
            partidos,
            cargos: ordenar(dadosFiltros.cargo),
            cidades: ordenar(dadosFiltros.cidade),
            ocupacoes: ordenar(dadosFiltros.ocupacao),
            formacoes: ordenar(dadosFiltros.formacao),
            instrucoes: ordenar(dadosFiltros.instrucao),
            temas: ordenar(dadosFiltros.temas)
          });
        } else {
          console.warn("Documento de metadados não encontrado no Firestore.");
        }

      } catch (error) {
        console.error("Erro ao carregar dados dos filtros via metadados:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    carregarDadosFiltros();

    return () => {
      isMounted = false;
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
      filtros.ocupacao?.trim() ||
      filtros.instrucao?.trim() ||
      filtros.formacao?.trim() ||
      (filtros.temasSelecionados && filtros.temasSelecionados.length > 0);

    if (!temFiltro) {
      dispararShake();          // Ativa o feedback visual de erro na tela
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);  // Faz o celular vibrar
      setSnackbarVisivel(true); // Exibe o popup elegante vindo de baixo
      return;
    }

    router.push({
      pathname: '/candidatos/resultados',
      params: {
        nome: filtros.nome || '',
        partido: filtros.partido || '',
        cargo: filtros.cargo || '',
        local: filtros.cidade || '',
        ocupacao: filtros.ocupacao || '',
        instrucao: filtros.instrucao || '',
        formacao: filtros.formacao || '',
        temasSelecionados: JSON.stringify(filtros.temasSelecionados || [])
      }
    });
  };

  // Renderização condicional para o estado de carregamento
  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: coresAtuais.primariaVerde }]}>
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={{ color: '#fff', marginTop: 10 }}>Carregando filtros...</Text>
      </View>
    );
  }

  const itensPartidos = listas.partidos.map(p => ({ label: `${p.sigla} - ${p.nome}`, value: p.id, key: p.id }));
  const itensCargos = listas.cargos.map(c => ({ label: c, value: c, key: c }));
  const itensCidades = listas.cidades.map(c => ({ label: c, value: c, key: c }));
  const itensOcupacoes = listas.ocupacoes.map(c => ({ label: c, value: c, key: c }));
  const itensFormacoes = listas.formacoes.map(c => ({ label: c, value: c, key: c }));
  const itensInstrucoes = listas.instrucoes.map(c => ({ label: c, value: c, key: c }));

  return (
    <View style={{ flex: 1, backgroundColor: coresAtuais.primariaVerde }}>
      <Animated.ScrollView 
        style={[styles.container, { transform: [{ translateX: shakeAnimation }] }]}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <Text style={styles.label}>Nome</Text>
        <Searchbar
          placeholder="Nome do candidato"
          value={filtros.nome}
          onChangeText={(t) => setFiltros({ ...filtros, nome: t })}
          style={styles.searchBar}
        />

        <Text style={styles.label}>Partido</Text>
        <DropDownPicker
          open={openPartido}
          value={filtros.partido}
          items={itensPartidos}
          setOpen={setOpenPartido}
          setValue={(callback) => setFiltros(prev => ({ ...prev, partido: callback(prev.partido) }))}
          placeholder="Todos os Partidos"
          style={styles.dropdown}
          dropDownContainerStyle={styles.dropdownContainer}
          zIndex={openPartido ? 1000 : 1}
          listMode="SCROLLVIEW"
        />

        <Text style={styles.label}>Cargo</Text>
        <DropDownPicker
          open={openCargo}
          value={filtros.cargo}
          items={itensCargos}
          setOpen={setOpenCargo}
          setValue={(callback) => setFiltros(prev => ({ ...prev, cargo: callback(prev.cargo) }))}
          placeholder="Selecione o Cargo"
          style={styles.dropdown}
          dropDownContainerStyle={styles.dropdownContainer}
          zIndex={openCargo ? 1000 : 1}
          listMode="SCROLLVIEW"
        />

        <Text style={styles.label}>Cidade</Text>
        <DropDownPicker
          open={openCidade}
          value={filtros.cidade}
          items={itensCidades}
          setOpen={setOpenCidade}
          setValue={(callback) => setFiltros(prev => ({ ...prev, cidade: callback(prev.cidade) }))}
          placeholder="Selecione a Cidade"
          style={styles.dropdown}
          dropDownContainerStyle={styles.dropdownContainer}
          zIndex={openCidade ? 1000 : 1}
          listMode="SCROLLVIEW"
        />

        <Text style={styles.label}>Ocupação</Text>
        <DropDownPicker
          open={openOcupacao}
          value={filtros.ocupacao}
          items={itensOcupacoes}
          setOpen={setOpenOcupacao}
          setValue={(callback) => setFiltros(prev => ({ ...prev, ocupacao: callback(prev.ocupacao) }))}
          placeholder="Selecione a Ocupação"
          style={styles.dropdown}
          dropDownContainerStyle={styles.dropdownContainer}
          zIndex={openOcupacao ? 1000 : 1}
          listMode="SCROLLVIEW"
        />

        <Text style={styles.label}>Instrução</Text>
        <DropDownPicker
          open={openInstrucao}
          value={filtros.instrucao}
          items={itensInstrucoes}
          setOpen={setOpenInstrucao}
          setValue={(callback) => setFiltros(prev => ({ ...prev, instrucao: callback(prev.instrucao) }))}
          placeholder="Selecione a Instrução"
          style={styles.dropdown}
          dropDownContainerStyle={styles.dropdownContainer}
          zIndex={openInstrucao ? 1000 : 1}
          listMode="SCROLLVIEW"
        />

        <Text style={styles.label}>Formação</Text>
        <DropDownPicker
          open={openFormacao}
          value={filtros.formacao}
          items={itensFormacoes}
          setOpen={setOpenFormacao}
          setValue={(callback) => setFiltros(prev => ({ ...prev, formacao: callback(prev.formacao) }))}
          placeholder="Selecione a Formação"
          style={styles.dropdown}
          dropDownContainerStyle={styles.dropdownContainer}
          zIndex={openFormacao ? 1000 : 1}
          listMode="SCROLLVIEW"
        />

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
      </Animated.ScrollView>

      {/* Popup estilo Telegram surgindo da base */}
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
    padding: 20
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