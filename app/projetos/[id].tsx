import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert, Image } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { db } from '../../firebaseconfig';
import { doc, getDoc, onSnapshot, runTransaction } from 'firebase/firestore';
import { Card, Button } from 'react-native-paper';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { cores } from '@/constants/colors';

export default function DetalhesProjeto() {
  const { id } = useLocalSearchParams() as { id: string };
  const router = useRouter();
  const auth = getAuth();
  
  const [projeto, setProjeto] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorito, setIsFavorito] = useState(false);
  const [loadingFavorito, setLoadingFavorito] = useState(false);

  // Estados da Enquete Dinâmica
  const [votoUsuario, setVotoUsuario] = useState<string | null>(null);
  const [loadingVoto, setLoadingVoto] = useState(false);
  const [estatisticas, setEstatisticas] = useState({ totalFavor: 0, parcialFavor: 0, parcialContra: 0, totalContra: 0 });
  
  // === NOVOS ESTADOS PARA OS PARTIDOS ===
  const [partidos, setPartidos] = useState<any[]>([]);
  const [votosPartidos, setVotosPartidos] = useState<Record<string, string>>({});
  const [loadingPartidos, setLoadingPartidos] = useState(true);

  const { tema, coresAtuais } = useTheme();
  const isDarkMode = tema === 'escuro';
  
  const obterInstanciaFunctions = () => {
    return getFunctions(getApp(), 'us-central1'); 
  };

  const verificarSeEIdFavorito = async (mountedRef: boolean) => {
    if (!auth.currentUser) return;
    try {
      const functions = obterInstanciaFunctions();
      const buscarFavoritosFn = httpsCallable(functions, 'favorites-buscarFavoritos');
      const resultado: any = await buscarFavoritosFn();
      
      const favoritos = resultado.data.favoritos || [];
      const jaEIdFavorito = favoritos.some((fav: any) => fav.id === id);
      
      if (mountedRef) {
        setIsFavorito(jaEIdFavorito);
      }
    } catch (error) {
      console.error('Erro ao verificar status de favorito:', error);
    }
  };

  useEffect(() => {
    let isMounted = true;

    // 1. Escuta em Tempo Real do Projeto e Estatísticas de Votos
    const docRef = doc(db, 'projeto', id);
    const unsubscribeProjeto = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists() && isMounted) {
        const dados = docSnap.data();
        setProjeto(dados);
        
        // Atualiza contadores locais salvos no documento do projeto
        setEstatisticas({
          totalFavor: dados.votosTotalFavor || 0,
          parcialFavor: dados.votosParcialFavor || 0,
          parcialContra: dados.votosParcialContra || 0,
          totalContra: dados.votosTotalContra || 0,
        });
      }
      setLoading(false);
    }, (error) => {
      console.error("Erro ao escutar projeto:", error);
      setLoading(false);
    });

    // === NOVA BUSCA EM TEMPO REAL: PARTIDOS E ORIENTAÇÕES ===
    const buscarDadosPartidos = async () => {
      try {
        const { collection, getDocs } = await import('firebase/firestore');
        
        // 1. Busca todos os partidos cadastrados para pegarmos número, logo, etc.
        const partidosSnap = await getDocs(collection(db, 'partidos'));
        const listaPartidos = partidosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        if (isMounted) setPartidos(listaPartidos);

        // 2. Escuta a subcoleção onde o ID do documento é a SIGLA do partido
        const votosPartidosRef = collection(db, 'projeto', id, 'orientacaoPartidos');
        const unsubscribeVotosPartidos = onSnapshot(votosPartidosRef, (snapshot) => {
          const mapeamento: Record<string, string> = {};
          
          snapshot.docs.forEach(doc => {
            const dados = doc.data();
            const siglaPartido = doc.id.toUpperCase(); // Garante a sigla em caixa alta (ex: MCN, PAS)
            
            // Puxa o campo correto do banco
            const tipoVotoBanco = dados.tipo_voto || '';

            // Normaliza o valor recebido para o padrão esperado pelas suas condicionais visuais
            if (tipoVotoBanco === 'A Favor' || tipoVotoBanco === 'Sim') {
              mapeamento[siglaPartido] = 'favor';
            } else if (tipoVotoBanco === 'Contra' || tipoVotoBanco === 'Não') {
              mapeamento[siglaPartido] = 'contra';
            } else {
              mapeamento[siglaPartido] = 'independente';
            }
          });

          if (isMounted) {
            setVotosPartidos(mapeamento);
            setLoadingPartidos(false);
          }
        });

        return unsubscribeVotosPartidos;
      } catch (error) {
        console.error("Erro ao buscar dados dos partidos:", error);
        if (isMounted) setLoadingPartidos(false);
      }
    };
    
    let unsubscribeVotosPartidosObtida: any = null;
    buscarDadosPartidos().then(unsub => {
      if (unsub) unsubscribeVotosPartidosObtida = unsub;
    });

    // 3. Escuta em Tempo Real se o usuário logado já votou nesta enquete
    let unsubscribeVoto = () => {};
    if (auth.currentUser) {
      const votoRef = doc(db, 'projeto', id, 'votos', auth.currentUser.uid);
      unsubscribeVoto = onSnapshot(votoRef, (votoSnap) => {
        if (votoSnap.exists() && isMounted) {
          setVotoUsuario(votoSnap.data().opcao);
        } else if (isMounted) {
          setVotoUsuario(null);
        }
      });
    }

    // 4. Validação assíncrona dos favoritos
    if (id) {
      verificarSeEIdFavorito(isMounted);
    }

    return () => {
      isMounted = false;
      unsubscribeProjeto();
      unsubscribeVoto();
      if (unsubscribeVotosPartidosObtida) unsubscribeVotosPartidosObtida();
    };
  }, [id, auth.currentUser]);

  // Função Transacional para Processar, Alterar ou Remover Votos de forma segura e atômica
  const processarVoto = async (opcaoSelecionada: string) => {
    if (!auth.currentUser) {
      Alert.alert("Atenção", "Você precisa estar logado para votar!");
      return;
    }

    setLoadingVoto(true);

    const projetoRef = doc(db, 'projeto', id);
    const votoRef = doc(db, 'projeto', id, 'votos', auth.currentUser.uid);

    // Mapeamento de campos para atualizar dinamicamente no banco
    const mapearCampo = (op: string) => {
      if (op === 'totalContra') return 'votosTotalContra';
      if (op === 'parcialContra') return 'votosParcialContra';
      if (op === 'parcialFavor') return 'votosParcialFavor';
      if (op === 'totalFavor') return 'votosTotalFavor';
      return 'votosTotalFavor'; // Fallback seguro
    };

    try {
      await runTransaction(db, async (transaction) => {
        const projetoSnap = await transaction.get(projetoRef);
        const votoSnap = await transaction.get(votoRef);

        if (!projetoSnap.exists()) {
          throw "Projeto não encontrado.";
        }

        const dadosProjeto = projetoSnap.data();

        // CASO 1: Usuário clicou na MESMA opção que já tinha votado (Quer remover o voto)
        if (votoSnap.exists() && votoSnap.data().opcao === opcaoSelecionada) {
          const campoDiminuir = mapearCampo(opcaoSelecionada);
          const atualContagem = dadosProjeto[campoDiminuir] || 0;

          transaction.set(projetoRef, { [campoDiminuir]: Math.max(0, atualContagem - 1) }, { merge: true });
          transaction.delete(votoRef);
          return;
        }

        // CASO 2: Usuário está MUDANDO de voto
        if (votoSnap.exists() && votoSnap.data().opcao !== opcaoSelecionada) {
          const opcaoAntiga = votoSnap.data().opcao;
          const campoDiminuir = mapearCampo(opcaoAntiga);
          const campoAumentar = mapearCampo(opcaoSelecionada);

          const contagemAntiga = dadosProjeto[campoDiminuir] || 0;
          const contagemNova = dadosProjeto[campoAumentar] || 0;

          transaction.set(projetoRef, {
            [campoDiminuir]: Math.max(0, contagemAntiga - 1),
            [campoAumentar]: contagemNova + 1
          }, { merge: true });
          
          transaction.set(votoRef, { opcao: opcaoSelecionada, alteradoEm: new Date() });
          return;
        }

        // CASO 3: Novo voto (Primeira vez votando)
        const campoAumentar = mapearCampo(opcaoSelecionada);
        const contagemNova = dadosProjeto[campoAumentar] || 0;

        transaction.set(projetoRef, { [campoAumentar]: contagemNova + 1 }, { merge: true });
        transaction.set(votoRef, { opcao: opcaoSelecionada, criadoEm: new Date() });
      });

      // Feedback visual opcional de sucesso
    } catch (error) {
      console.error("Erro na transação de voto:", error);
      Alert.alert("Erro", "Não foi possível registrar seu voto. Tente novamente.");
    } finally {
      setLoadingVoto(false);
    }
  };

  const alternarFavorito = async () => {
    if (!auth.currentUser) {
      Alert.alert("Atenção", "Você precisa estar logado para favoritar um projeto!");
      return;
    }
    if (loadingFavorito) return;
    
    setLoadingFavorito(true);
    const functions = obterInstanciaFunctions();

    try {
      await auth.currentUser.getIdToken(true);
      if (isFavorito) {
        const removerFn = httpsCallable(functions, 'favorites-removerFavorito');
        await removerFn({ itemId: id, userUid: auth.currentUser.uid });
        setIsFavorito(false);
      } else {
        const adicionarFn = httpsCallable(functions, 'favorites-adicionarFavorito');
        await adicionarFn({ itemId: id, tipoItem: 'projeto', userUid: auth.currentUser.uid });
        setIsFavorito(true);
      }
    } catch (error) {
      console.error('Erro ao alternar favorito:', error);
      Alert.alert("Erro", "Não foi possível atualizar o favorito. Tente novamente.");
    } finally {
      setLoadingFavorito(false);
    }
  };  

  if (loading) return (
    <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: coresAtuais.primariaVerde }]}>
      <ActivityIndicator style={[styles.center, { backgroundColor: coresAtuais.primariaVerde } ]} size="large" color="#fff" />
    </View>
  );

  const nomesAutores = projeto?.autores 
    ? Object.values(projeto.autores).map((a: any) => a.nomePolitico).join(', ') 
    : 'Não informado';

  // Cálculos das estatísticas de porcentagem
  const totalVotos = estatisticas.totalFavor + estatisticas.parcialFavor + estatisticas.parcialContra + estatisticas.totalContra;
  const obterPorcentagem = (votos: number) => {
    if (totalVotos === 0) return '0%';
    return `${Math.round((votos / totalVotos) * 100)}%`;
  };

  return (
    <>
    <Stack.Screen 
      options={{ 
        title: `PL ${projeto?.numero}/${projeto?.ano}`,
        headerStyle: {
          backgroundColor: coresAtuais.primariaVerde
        },
        headerTintColor: coresAtuais.texto,
        headerTitleAlign: "center",
      }} 
    />

    <ScrollView style={[styles.container, { backgroundColor: coresAtuais.primariaVerde }]}>
      {/* CARD 1: Detalhes do Projeto */}
      <Card style={[styles.cardPrincipal, { backgroundColor: coresAtuais.card }, isDarkMode && styles.neonBorder]}>
        <Card.Content>
          <TouchableOpacity style={styles.botaoEstrela} onPress={alternarFavorito} disabled={loadingFavorito}>
            {loadingFavorito ? (
              <ActivityIndicator size="small" color="#FFD700" />
            ) : (
              <FontAwesome name={isFavorito ? "star" : "star-o"} size={28} color="#FFD700" />
            )}
          </TouchableOpacity>
          <Text style={[styles.tituloProjeto, { color: coresAtuais.texto }]}>{projeto?.tipoProjeto} Nº{projeto?.numero}/{projeto?.ano}</Text>
          <Text style={[styles.label, { color: coresAtuais.texto }]}>Nome do Projeto: <Text style={[styles.valor, { color: coresAtuais.texto }]}>{projeto?.nome}</Text></Text>
          <Text style={[styles.label, { color: coresAtuais.texto }]}>Ano de criação do Projeto: <Text style={[styles.valor, { color: coresAtuais.texto }]}>{projeto?.ano}</Text></Text>
          <Text style={[styles.label, { color: coresAtuais.texto }]}>Órgão de origem do Projeto: <Text style={[styles.valor, { color: coresAtuais.texto }]}>{projeto?.orgao}</Text></Text>
          
          <Text style={[styles.secaoTitulo, { color: coresAtuais.texto }]}>Descrição:</Text>
          <Text style={[styles.descricao, { color: coresAtuais.texto }]}>{projeto?.descricao}</Text>
          <Text style={[styles.label, { color: coresAtuais.texto }]}>Situação: <Text style={[styles.valor, { color: coresAtuais.texto }]}>{projeto?.estado}</Text></Text>
          <Text style={[styles.label, { color: coresAtuais.texto }]}>Área temática: 
            <Text style={[styles.valor, { color: coresAtuais.texto }]}> {Array.isArray(projeto?.areaTematica) ? projeto.areaTematica.join(', ') : projeto?.areaTematica}</Text>
          </Text>
        </Card.Content>
      </Card>

      {/* CARD 2: Autoria Dinâmica por Parlamentar */}
      {projeto?.autores && Object.keys(projeto.autores).length > 0 ? (
        Object.entries(projeto.autores).map(([chave, autor]: [string, any]) => (
          <Card 
            key={chave} 
            style={[styles.cardAutorIndividual, { backgroundColor: coresAtuais.card }, isDarkMode && styles.neonBorder]}
            onPress={() => {
              if (autor.idPolitico) {
                // Navega para a pasta/tela de perfil passando o ID do político
                router.push(`/politicos/${autor.idPolitico}`); 
              } else {
                Alert.alert("Aviso", "Perfil deste parlamentar não disponível.");
              }
            }}
          >
            <Card.Content style={styles.conteudoAutorCard}>
              <View style={styles.infoAutorTexto}>
                <Text style={[styles.labelAutor, { color: coresAtuais.texto }]}>Autor da Proposta</Text>
                <Text style={[styles.valorAutor, { color: coresAtuais.texto }]}>{autor.nomePolitico || 'Não informado'}</Text>
                <Text style={[styles.orgaoText, { color: coresAtuais.texto }]}>{projeto?.orgao}</Text>
              </View>
              {/* Ícone indicando que o card é clicável */}
              <FontAwesome name="chevron-right" size={16} color={isDarkMode ? '#ffffff' : '#000000' } />
            </Card.Content>
          </Card>
        ))
      ) : (
        <Card style={styles.cardSecundario}>
          <Card.Content>
            <Text style={styles.valorAutor}>Nenhum autor informado</Text>
          </Card.Content>
        </Card>
      )}

      {/* CARD 3: Enquete Dinâmica e Interativa */}
      <Card style={[styles.cardSecundario, { backgroundColor: coresAtuais.card }, isDarkMode && styles.neonBorder]}>
        <Card.Content>
          <Text style={[styles.perguntaEnquete, { color: coresAtuais.texto }]}>Você apoia essa proposta?</Text>
          
          {loadingVoto && <ActivityIndicator size="small" color="#2b47f2" style={{ marginBottom: 10 }} />}

          <View style={styles.areaBotoes}>
            <Button 
              mode={votoUsuario === 'totalFavor' ? 'contained' : 'outlined'} 
              buttonColor={votoUsuario === 'totalFavor' ? '#009440' : '#ffffff'}
              textColor={votoUsuario === 'totalFavor' ? '#fff' : '#2b47f2'}
              style={styles.btnEnquete} 
              disabled={loadingVoto}
              onPress={() => processarVoto('totalFavor')}
            >
              Totalmente favorável {votoUsuario && totalVotos > 0 && `(${obterPorcentagem(estatisticas.totalFavor)})`}
            </Button>

            <Button 
              mode={votoUsuario === 'parcialFavor' ? 'contained' : 'outlined'} 
              buttonColor={votoUsuario === 'parcialFavor' ? '#ffaa00' : '#ffffff'}
              textColor={votoUsuario === 'parcialFavor' ? '#fff' : '#2b47f2'}
              style={styles.btnEnquete} 
              disabled={loadingVoto}
              onPress={() => processarVoto('parcialFavor')}
            >
              Parcialmente favorável {votoUsuario && totalVotos > 0 && `(${obterPorcentagem(estatisticas.parcialFavor)})`}
            </Button>

            <Button 
              mode={votoUsuario === 'parcialContra' ? 'contained' : 'outlined'} 
              buttonColor={votoUsuario === 'parcialContra' ? '#ffaa00' : '#ffffff'}
              textColor={votoUsuario === 'parcialContra' ? '#fff' : '#2b47f2'}
              style={styles.btnEnquete} 
              disabled={loadingVoto}
              onPress={() => processarVoto('parcialContra')}
            >
              Parcialmente contrário {votoUsuario && totalVotos > 0 && `(${obterPorcentagem(estatisticas.parcialContra)})`}
            </Button>

            <Button 
              mode={votoUsuario === 'totalContra' ? 'contained' : 'outlined'} 
              buttonColor={votoUsuario === 'totalContra' ? '#ff4d4d' : '#ffffff'}
              textColor={votoUsuario === 'totalContra' ? '#fff' : '#2b47f2'}
              style={styles.btnEnquete} 
              disabled={loadingVoto}
              onPress={() => processarVoto('totalContra')}
            >
              Totalmente contrário {votoUsuario && totalVotos > 0 && `(${obterPorcentagem(estatisticas.totalContra)})`}
            </Button>
          </View>

          {votoUsuario && totalVotos > 0 && (
            <Text style={[styles.totalVotosText, { color: coresAtuais.textoSecundario }]}>Total de votos coletados: {totalVotos}</Text>
          )}
        </Card.Content>
      </Card>

      {/* CARD 4: Posicionamento dos Partidos */}
      <Card style={[styles.cardSecundario, { backgroundColor: coresAtuais.card }, isDarkMode && styles.neonBorder]}>
        <Card.Content>
          <Text style={[styles.tituloSecaoPartidos, { color: coresAtuais.texto }]}>Posicionamento dos Partidos</Text>
          
          {loadingPartidos ? (
            <ActivityIndicator size="small" color={coresAtuais.texto} />
          ) : (
            <View style={styles.containerMinicards}>
              {partidos.map((partido: any) => {
                // Puxa a orientação usando a sigla do partido como chave (ex: votosPartidos["PT"])
                const siglaChave = (partido.sigla || '').toUpperCase();
                const voto = votosPartidos[siglaChave] || 'independente';
                
                // Configuração visual das tags
                let configTag = { texto: 'Independente', bg: '#e0e0e0', cor: '#616161' };
                if (voto === 'favor') configTag = { texto: 'A Favor', bg: '#d4edda', cor: '#155724' };
                if (voto === 'contra') configTag = { texto: 'Contra', bg: '#f8d7da', cor: '#721c24' };

                return (
                  <View key={partido.id} style={[styles.minicard, { backgroundColor: isDarkMode ? '#1e293b' : '#f9f9f9', borderColor: isDarkMode ? '#334155' : '#eee' }]}>
                    <View style={styles.partidoInfo}>
                      <Image
                        source={{ uri: partido.logo }}
                        style={styles.logoPartido}
                      />
                      <Text style={[styles.siglaPartido, { color: coresAtuais.texto }]}>{partido.sigla || 'SIGLA'}</Text>
                      <Text style={[styles.numeroPartido, { color: coresAtuais.textoSecundario || '#777' }]}>Nº {partido.numero || '--'}</Text>
                    </View>
                    
                    <View style={[styles.tagVoto, { backgroundColor: configTag.bg }]}>
                      <Text style={[styles.tagVotoTexto, { color: configTag.cor }]}>{configTag.texto}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </Card.Content>
      </Card>

      <View style={{ height: 40 }} />
    </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 15 
  },
  center: { 
    flex: 1, 
    justifyContent: 'center',  
  },
  cardPrincipal: { 
    borderRadius: 20, 
    marginBottom: 15, 
    paddingVertical: 10
  },
  cardSecundario: { 
    borderRadius: 20, 
    marginBottom: 15 
  },
  tituloProjeto: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    textAlign: 'center', 
    marginBottom: 15,
    marginTop: 15 
  },
  label: { 
    fontWeight: 'bold', 
    marginTop: 10 
  },
  valor: { 
    fontWeight: 'normal' 
  },
  secaoTitulo: { 
    fontWeight: 'bold', 
    marginTop: 15 
  },
  descricao: { 
    textAlign: 'justify',  
    lineHeight: 20, 
    marginTop: 5 
  },
  cardTitle: { 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
  valorAutor: { 
    fontSize: 16
  },
  orgaoText: { 
    fontSize: 12, 
    marginTop: 4 
  },
  perguntaEnquete: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    textAlign: 'center', 
    marginVertical: 10 
  },
  areaBotoes: { 
    gap: 10, 
    marginTop: 10 
  },
  btnEnquete: { 
    borderRadius: 8, 
    borderWidth: 1.5 
  },
  botaoEstrela: { 
    position: 'absolute', 
    right: 0, 
    top: 0, 
    padding: 5 
  },
  totalVotosText: { 
    textAlign: 'center',  
    marginTop: 15, 
    fontSize: 12, 
    fontStyle: 'italic' 
  },
  cardAutorIndividual: {
    borderRadius: 15,
    marginBottom: 10,
    elevation: 2,
  },
  conteudoAutorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoAutorTexto: {
    flex: 1,
  },
  labelAutor: {
    fontSize: 11,
    color: '#666',
    textTransform: 'uppercase',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  neonBorder: {
    borderWidth: 0.8,           // Borda bem pequena/fina
    borderColor: '#91dbd6',
    // Opcional: Adiciona um leve brilho no Android/iOS se desejar
    shadowColor: '#91dbd6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
  },
  tituloSecaoPartidos: {
    fontSize: 18, 
    fontWeight: 'bold', 
    textAlign: 'center', 
    marginVertical: 12 
  },
  containerMinicards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 5,
  },
  minicard: {
    width: '48%', // Mantém dois cards por linha
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 95,
  },
  partidoInfo: {
    alignItems: 'center',
    marginBottom: 6,
  },
  siglaPartido: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  numeroPartido: {
    fontSize: 11,
    marginTop: 1,
  },
  tagVoto: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    width: '100%',
    alignItems: 'center',
  },
  tagVotoTexto: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  logoPartido: { 
    width: 80, 
    height: 80, 
    borderRadius: 10, 
    resizeMode: 'contain' 
  },
});