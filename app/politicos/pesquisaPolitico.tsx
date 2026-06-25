import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Animated } from 'react-native';
import { db } from '../../firebaseconfig';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import DropDownPicker from 'react-native-dropdown-picker';
import { Button, Searchbar, Snackbar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import * as Haptics from 'expo-haptics';

export default function PesquisaParlamentar() {
  const router = useRouter();
  const [listas, setListas] = useState({ partidos: [], cargos: [], locais: [], formacoes: [] });
  const [filtros, setFiltros] = useState({ nome: '', partido: '', cargo: '', local: '', formacao: '', genero: '' });
  const [loading, setLoading] = useState(true);
  const [snackbarVisivel, setSnackbarVisivel] = useState(false);

  const [openPartido, setOpenPartido] = useState(false);
  const [openCargo, setOpenCargo] = useState(false);
  const [openLocal, setOpenLocal] = useState(false);
  const [openFormacao, setOpenFormacao] = useState(false);
  const [openGenero, setOpenGenero] = useState(false);

  const shakeAnimation = useRef(new Animated.Value(0)).current;

  const { tema, coresAtuais } = useTheme();
  const isDarkMode = tema === 'escuro';

  useEffect(() => {
    let isMounted = true;

    const carregarFiltrosPoliticos = async () => {
      try {
        // Otimização de Cache local
        if (listas.partidos.length > 0) {
          setLoading(false);
          return;
        }

        // 1. Busca os partidos (coleção separada)
        const snapPartidos = await getDocs(collection(db, 'partidos'));
        const listaPartidos = snapPartidos.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // 2. BUSCA O NOVO DOCUMENTO DE METADADOS DOS PARLAMENTARES
        const docRef = doc(db, 'metadados', 'filtrosParlamentares');
        const snapMetadados = await getDoc(docRef);

        if (snapMetadados.exists() && isMounted) {
          const dadosFiltros = snapMetadados.data();

          // Função auxiliar para ordenar tratando acentos e caracteres especiais locais
          const ordenar = (array: string[]) => {
            return (array || []).slice().sort((a, b) => a.localeCompare(b, 'pt-BR'));
          };

          setListas({
            partidos: listaPartidos, // Pode ordenar no mapeamento dos itens se desejar
            cargos: ordenar(dadosFiltros.cargo),
            locais: ordenar(dadosFiltros.local),
            formacoes: ordenar(dadosFiltros.formacao),
            // Se quiser usar a lista de gêneros vinda do banco futuramente, repare no 'G' maiúsculo:
            // generos: ordenar(dadosFiltros['Gênero']) 
          });
        } else {
          console.warn("Documento filtrosParlamentares não foi encontrado.");
        }
      } catch (error) {
        console.error("Erro ao carregar políticos via metadados:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    carregarFiltrosPoliticos();

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

  const handlePesquisar = () => {
    const temFiltro =
      filtros.nome?.trim() ||
      filtros.partido ||
      filtros.cargo ||
      filtros.formacao ||
      filtros.genero ||
      filtros.local?.trim();
  
    if (!temFiltro) {
      dispararShake();          // Ativa o feedback visual de erro na tela
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);  // Faz o celular vibrar
      setSnackbarVisivel(true); // Exibe o popup elegante vindo de baixo
      return;
    }
  
    router.push({
      pathname: '/politicos/resultados',
      params: {
        nome: filtros.nome || '',
        partido: filtros.partido || '',
        cargo: filtros.cargo || '',
        local: filtros.local || '',
        formacao: filtros.formacao || '',
        genero: filtros.genero || ''
      }
    });
  };

  // Renderização condicional para a animação de carregamento
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
  const itensLocais = listas.locais.map(l => ({ label: l, value: l, key: l }));
  const itensFormacoes = listas.formacoes.map(l => ({ label: l, value: l, key: l }));
  const itensGenero = [
    { label: 'Masculino', value: 'Masculino', key: 'M' },
    { label: 'Feminino', value: 'Feminino', key: 'F' }
  ];

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
          placeholder="Todos os Cargos"
          style={styles.dropdown}
          dropDownContainerStyle={styles.dropdownContainer}
          zIndex={openCargo ? 1000 : 1}
          listMode="SCROLLVIEW"
        />

        <Text style={styles.label}>Estado/Local</Text>
        <DropDownPicker
          open={openLocal}
          value={filtros.local}
          items={itensLocais}
          setOpen={setOpenLocal}
          setValue={(callback) => setFiltros(prev => ({ ...prev, local: callback(prev.local) }))}
          placeholder="Todos os Estados"
          style={styles.dropdown}
          dropDownContainerStyle={styles.dropdownContainer}
          zIndex={openLocal ? 1000 : 1}
          listMode="SCROLLVIEW"
        />

        <Text style={styles.label}>Formação</Text>
        <DropDownPicker
          open={openFormacao}
          value={filtros.formacao}
          items={itensFormacoes}
          setOpen={setOpenFormacao}
          setValue={(callback) => setFiltros(prev => ({ ...prev, formacao: callback(prev.formacao) }))}
          placeholder="Todos as Formações"
          style={styles.dropdown}
          dropDownContainerStyle={styles.dropdownContainer}
          zIndex={openFormacao ? 1000 : 1}
          listMode="SCROLLVIEW"
        />

        <Text style={styles.label}>Gênero</Text>
        <DropDownPicker
          open={openGenero}
          value={filtros.genero}
          items={itensGenero}
          setOpen={setOpenGenero}
          setValue={(callback) => setFiltros(prev => ({ ...prev, genero: callback(prev.genero) }))}
          placeholder="Selecione o gênero"
          style={styles.dropdown}
          dropDownContainerStyle={styles.dropdownContainer}
          zIndex={openGenero ? 1000 : 1}
          listMode="SCROLLVIEW"
        />

        <Button mode="contained" onPress={handlePesquisar} style={styles.btnPesquisar}>
          Pesquisar
        </Button>
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