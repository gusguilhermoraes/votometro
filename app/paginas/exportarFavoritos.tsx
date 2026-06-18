import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { Button } from 'react-native-paper';
import { Feather } from '@expo/vector-icons';
import { gerarPDFEleicaoMunicipal } from '../components/exportarPdfMunicipal';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebaseconfig';

// Tipagem básica para organização
type TipoEleicao = 'municipal' | 'nacional_1s' | 'nacional_2s' | null;

interface Candidato {
  id: string;
  nome: string;
  partido: string;
  cargo: 'Prefeito' | 'Vereador';
  numero: string;
}

export default function TelaVotacao() {
  const [step, setStep] = useState(1);
  const [tipoEleicao, setTipoEleicao] = useState<TipoEleicao>(null);

  const [loading, setLoading] = useState(true);

  // Lista dinâmica que virá do Firebase
  const [candidatosFavoritos, setCandidatosFavoritos] = useState<Candidato[]>([]);

  // Estados da Etapa 2: Candidatos Selecionados
  const [prefeitoSel, setPrefeitoSel] = useState<Candidato | null>(null);
  const [vereadorSel, setVereadorSel] = useState<Candidato | null>(null);

  useEffect(() => {
    async function carregarFavoritos() {
      setLoading(true);
      const functions = getFunctions();
      
      try {
        const buscarFavoritosFn = httpsCallable(functions, 'favorites-buscarFavoritos');
        const resultado: any = await buscarFavoritosFn();
        const listaFavoritos = resultado.data.favoritos || [];

        // Filtra apenas os favoritos do tipo 'candidato' antes de buscar no Firestore
        const favoritosCandidatos = listaFavoritos.filter((fav: any) => fav.tipo === 'candidato');

        const promessas = favoritosCandidatos.map(async (fav: any) => {
          const docRef = doc(db, 'candidatos', fav.id);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const dados = docSnap.data();
            
            // Mapeia a estrutura do Firestore para a interface 'Candidato' esperada por esta tela
            return {
              id: fav.id,
              nome: dados.nomeUrna || dados.nome || 'Sem Nome',
              partido: dados.partidoId?.toUpperCase() || 'Sem Partido',
              cargo: dados.cargo, // Deve vir exatamente 'Prefeito' ou 'Vereador' do Firestore
              numero: dados.numero || 'S/N',
              foto: dados.fotoUrl || 'S/N'
            } as Candidato;
          }
          return null; 
        });

        const candidatosIdratados = (await Promise.all(promessas)).filter(item => item !== null) as Candidato[];
        setCandidatosFavoritos(candidatosIdratados);

      } catch (error) {
        console.error("Erro ao carregar favoritos na tela de exportação:", error);
        Alert.alert('Erro', 'Não foi possível carregar seus candidatos favoritos.');
      } finally {
        setLoading(false);
      }
    }

    carregarFavoritos();
  }, []);

  const handleAvancarEtapa1 = () => {
    if (!tipoEleicao) {
      Alert.alert('Atenção', 'Por favor, selecione o tipo de eleição para continuar.');
      return;
    }
    setStep(2);
  };

  const handleVoltar = () => {
    if (step === 2) {
      setStep(1);
    }
  };

  const handleGerarPDF = async () => {
    // Permite avançar mesmo se um deles for nulo (voto em branco/não preenchido)
    if (!prefeitoSel && !vereadorSel) {
      Alert.alert('Atenção', 'Selecione ao menos um candidato ou deixe um em branco, mas não envie a colinha totalmente vazia.');
      return;
    }

    try {
      await gerarPDFEleicaoMunicipal({
        tipo: tipoEleicao!,
        prefeito: prefeitoSel,
        vereador: vereadorSel
      });
    } catch (error) {
      console.error("Erro capturado na TelaVotacao:", error);
      Alert.alert('Erro', 'Não foi possível gerar o PDF da colinha.');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {step === 2 && (
          <TouchableOpacity style={styles.voltar} onPress={handleVoltar}>
            <Feather name="arrow-left" size={22} color="#00A651" />
          </TouchableOpacity>
        )}

        <View style={styles.header}>
          <Text style={styles.titulo}>Gerador de Colinha</Text>
          <Text style={styles.subtitulo}>
            {step === 1 ? 'Passo 1 de 2: Tipo de Eleição' : 'Passo 2 de 2: Escolha seus Candidatos'}
          </Text>
        </View>

        {/* ================= ETAPA 1: SELEÇÃO DO TIPO ================= */}
        {step === 1 && (
          <View style={styles.formCard}>
            
            {/* Opção 1: Municipais (Ativo) */}
            <TouchableOpacity 
              style={[styles.cardOpcao, tipoEleicao === 'municipal' && styles.cardOpcaoAtivo]}
              onPress={() => setTipoEleicao('municipal')}
            >
              <Feather name="map-pin" size={24} color={tipoEleicao === 'municipal' ? '#FFF' : '#1e232c'} />
              <View style={styles.textoCardContainer}>
                <Text style={[styles.cardTitulo, tipoEleicao === 'municipal' && styles.textoAtivo]}>Eleições Municipais</Text>
                <Text style={[styles.cardSubtitulo, tipoEleicao === 'municipal' && styles.textoAtivoSub]}>Prefeito e Vereador</Text>
              </View>
            </TouchableOpacity>

            {/* Opção 2: Nacionais 1 Senador (Bloqueado) */}
            <View style={[styles.cardOpcao, styles.cardBloqueado]}>
              <Feather name="lock" size={24} color="#888" />
              <View style={styles.textoCardContainer}>
                <Text style={[styles.cardTitulo, { color: '#888' }]}>Nacionais (1 Senador)</Text>
                <Text style={styles.cardSubtitulo}>Breve - Indisponível no momento</Text>
              </View>
            </View>

            {/* Opção 3: Nacionais 2 Senadores (Bloqueado) */}
            <View style={[styles.cardOpcao, styles.cardBloqueado]}>
              <Feather name="lock" size={24} color="#888" />
              <View style={styles.textoCardContainer}>
                <Text style={[styles.cardTitulo, { color: '#888' }]}>Nacionais (2 Senadores)</Text>
                <Text style={styles.cardSubtitulo}>Breve - Indisponível no momento</Text>
              </View>
            </View>

            <Button
              mode="contained"
              onPress={handleAvancarEtapa1}
              style={styles.botaoAcao}
              labelStyle={styles.botaoTexto}
            >
              Continuar
            </Button>
          </View>
        )}

        {/* ================= ETAPA 2: SELEÇÃO DE CANDIDATOS ================= */}
        {step === 2 && (
          <View style={styles.formCard}>
            
            {/* SEÇÃO: PREFEITO */}
            <Text style={styles.secaoTitulo}>Prefeito</Text>
            {candidatosFavoritos.filter(c => c.cargo === 'Prefeito').map(cand => (
              <TouchableOpacity
                key={cand.id}
                style={[styles.itemCandidato, prefeitoSel?.id === cand.id && styles.itemCandidatoAtivo]}
                onPress={() => setPrefeitoSel(prefeitoSel?.id === cand.id ? null : cand)} // Desmarca se clicar de novo (deixando em branco)
              >
                <Text style={[styles.candNome, prefeitoSel?.id === cand.id && styles.textoAtivo]}>{cand.nome}</Text>
                <Text style={[styles.candNumero, prefeitoSel?.id === cand.id && styles.textoAtivoSub]}>{cand.numero} - {cand.partido}</Text>
              </TouchableOpacity>
            ))}
            {prefeitoSel === null && <Text style={styles.textoVotoBranco}>Nenhum selecionado (Voto em branco/nulo)</Text>}

            <View style={styles.divisor} />

            {/* SEÇÃO: VEREADOR */}
            <Text style={styles.secaoTitulo}>Vereador</Text>
            {candidatosFavoritos.filter(c => c.cargo === 'Vereador').map(cand => (
              <TouchableOpacity
                key={cand.id}
                style={[styles.itemCandidato, vereadorSel?.id === cand.id && styles.itemCandidatoAtivo]}
                onPress={() => setVereadorSel(vereadorSel?.id === cand.id ? null : cand)}
              >
                <Text style={[styles.candNome, vereadorSel?.id === cand.id && styles.textoAtivo]}>{cand.nome}</Text>
                <Text style={[styles.candNumero, vereadorSel?.id === cand.id && styles.textoAtivoSub]}>{cand.numero} - {cand.partido}</Text>
              </TouchableOpacity>
            ))}
            {vereadorSel === null && <Text style={styles.textoVotoBranco}>Nenhum selecionado (Voto em branco/nulo)</Text>}

            <Button
              mode="contained"
              onPress={handleGerarPDF}
              style={[styles.botaoAcao, { backgroundColor: '#00A651' }]}
              labelStyle={styles.botaoTexto}
              icon="file-pdf-box"
            >
              Gerar PDF da Colinha
            </Button>
          </View>
        )}

      </ScrollView>
    </View>
  );
}

// Estilos espelhados do seu padrão visual (Verde de fundo, cards brancos/escuros)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#009440",
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 25,
    paddingBottom: 30,
    paddingTop: 40,
  },
  voltar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  header: {
    marginBottom: 25,
  },
  titulo: {
    fontSize: 28,
    fontWeight: '700',
    color: "#ffffff",
  },
  subtitulo: {
    fontSize: 15,
    color: '#e0f2fe',
    marginTop: 4,
  },
  formCard: {
    width: '100%',
  },
  cardOpcao: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#d1d1d1',
    elevation: 2,
  },
  cardOpcaoAtivo: {
    backgroundColor: '#1e232c',
    borderColor: '#1e232c',
  },
  cardBloqueado: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderColor: 'transparent',
    opacity: 0.6,
  },
  textoCardContainer: {
    marginLeft: 15,
  },
  cardTitulo: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e232c',
  },
  cardSubtitulo: {
    fontSize: 13,
    color: '#666',
  },
  textoAtivo: {
    color: '#FFF',
  },
  textoAtivoSub: {
    color: '#ccc',
  },
  secaoTitulo: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 10,
    marginTop: 10,
  },
  itemCandidato: {
    backgroundColor: '#FFF',
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  itemCandidatoAtivo: {
    backgroundColor: '#1e232c',
    borderColor: '#1e232c',
  },
  candNome: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e232c',
  },
  candNumero: {
    fontSize: 14,
    color: '#555',
  },
  textoVotoBranco: {
    fontSize: 13,
    color: '#e0f2fe',
    fontStyle: 'italic',
    marginBottom: 10,
  },
  divisor: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    my: 15,
    marginVertical: 15,
  },
  botaoAcao: {
    marginTop: 20,
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    backgroundColor: '#1e232c',
  },
  botaoTexto: {
    fontSize: 16,
    fontWeight: '600',
  },
});