import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Image, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator 
} from 'react-native';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { Feather } from '@expo/vector-icons';
import ListaVazia from '../components/ListaVazia';

// Importação do roteador do Expo Router
import { useRouter } from 'expo-router'; 
import { db } from '../../firebaseconfig';


export default function TelaFavoritos() {
  const router = useRouter();

  // Estados para gerenciar as listas separadas
  const [politicos, setPoliticos] = useState([]);
  const [candidatos, setCandidatos] = useState([]);
  const [projetos, setProjetos] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState('candidato'); // 'politico' | 'candidato' | 'projeto'

  const retornar = () => {
    router.back();
  };

  useEffect(() => {
    async function carregarEIdratarFavoritos() {
      setLoading(true);
      const functions = getFunctions();
      
      try {
        // 1. Busca as referências na Cloud Function
        const buscarFavoritosFn = httpsCallable(functions, 'favorites-buscarFavoritos');
        const resultado = await buscarFavoritosFn();
        const listaFavoritos = resultado.data.favoritos || [];

        // 2. Hidratação dos dados em paralelo
        const promessas = listaFavoritos.map(async (fav) => {
          let colecaoOrigem = '';
          if (fav.tipo === 'politico') colecaoOrigem = 'parlamentar';
          else if (fav.tipo === 'candidato') colecaoOrigem = 'candidatos';
          else if (fav.tipo === 'projeto') colecaoOrigem = 'projeto';

          if (!colecaoOrigem) return null;

          const docRef = doc(db, colecaoOrigem, fav.id);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            return {
              id: fav.id,
              tipo: fav.tipo,
              ...docSnap.data()
            };
          }
          return null; 
        });

        const itensHidratados = (await Promise.all(promessas)).filter(item => item !== null);

        // 3. Separa as listas nos estados
        setPoliticos(itensHidratados.filter(item => item.tipo === 'politico'));
        setCandidatos(itensHidratados.filter(item => item.tipo === 'candidato'));
        setProjetos(itensHidratados.filter(item => item.tipo === 'projeto'));

      } catch (error) {
        console.error("Erro ao carregar favoritos no app:", error);
      } finally {
        setLoading(false);
      }
    }

    carregarEIdratarFavoritos();
  }, []);

  // Retorna a lista correta dependendo da aba ativa
  const obterListaExibida = () => {
    if (abaAtiva === 'politico') return politicos;
    if (abaAtiva === 'candidato') return candidatos;
    if (abaAtiva === 'projeto') return projetos;
    return [];
  };

  // Renderizador de cada card dentro da FlatList
  const renderItemCard = ({ item }) => {
    const ehPerfil = item.tipo === 'politico' || item.tipo === 'candidato';

    return (
      <TouchableOpacity 
        style={styles.card} 
        activeOpacity={0.7}
        onPress={() => router.push(`/${item.tipo}s/${item.id}`)}
      >
        {ehPerfil ? (
          <View style={styles.perfilContainer}>
            {/* Corrigido: Removido o 'user.uid' inexistente para não travar a tela */}
            <Image 
              source={{ uri: item.fotoUrl || `https://firebasestorage.googleapis.com/v0/b/votometro-adad1.firebasestorage.app/o/fotos_perfil%2Fusuario_padrao.png?alt=media&token=621ae248-d53d-4f9d-8305-400703a059be` }} 
              style={styles.foto} 
            />
            <View style={styles.infoContainer}>
              {/* Corrigido: Se for candidato usa nomeUrna, senão usa nome */}
              <Text style={styles.nome}>{item.tipo === 'candidato' ? item.nomeUrna : item.nome}</Text>
              {/* Tratamento para evitar que campos nulos quebrem o layout */}
              <Text style={styles.subtexto}>
                {item.tipo === 'candidato' 
                  ? `Candidato a ${item.cargo}` 
                  : `${item.cargo}`
                }
              </Text>
              <Text style={styles.subtexto}>
                {item.tipo === 'candidato' 
                  ? `Número: ${item.numero || 'S/N'}` 
                  : (item.partidoId?.toUpperCase() || 'Sem Partido')} — {item.local || item.localCargo || 'BR'}
              </Text>
            </View>
            <Text style={styles.seta}>➔</Text>
          </View>
        ) : (
          <View style={styles.projetoContainer}>
            <View style={styles.infoContainer}>
              <Text style={styles.tituloProjeto}>{item.tipoSigla} {item.numero}/{item.ano}</Text>
              <Text style={styles.ementa} numberOfLines={2}>{item.nome || item.descricao}</Text>
              <Text style={styles.ementa}>Cidade: {item.local}</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeTexto}>{item.estado || 'Em votação'}</Text>
              </View>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingTexto}>Carregando favoritos...</Text>
      </View>
    );
  }

  const renderFooter = () => {
  // Se não for a aba de candidatos ou a lista estiver vazia, não renderiza nada
    if (abaAtiva !== 'candidato' || candidatos.length === 0) return null;

    return (
      <TouchableOpacity 
        style={styles.botaoFooter} 
        onPress={() => router.push('/paginas/exportarFavoritos')}
      >
        <Text style={styles.botaoFooterTexto}>Ação para Candidatos</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.voltar} onPress={retornar}>
        <Feather name="arrow-left" size={22} color="#00A651" />
      </TouchableOpacity>
      <Text style={styles.headerTitulo}>Meus Favoritos</Text>

      {/* Menu de Abas (Tabs) */}
      <View style={styles.abasContainer}>
        <TouchableOpacity 
          style={[styles.abaBotao, abaAtiva === 'candidato' && styles.abaAtiva]} 
          onPress={() => setAbaAtiva('candidato')}
        >
          <Text style={[styles.abaTexto, abaAtiva === 'candidato' && styles.abaTextoAtivo]}>
            Candidatos ({candidatos.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.abaBotao, abaAtiva === 'politico' && styles.abaAtiva]} 
          onPress={() => setAbaAtiva('politico')}
        >
          <Text style={[styles.abaTexto, abaAtiva === 'politico' && styles.abaTextoAtivo]}>
            Políticos ({politicos.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.abaBotao, abaAtiva === 'projeto' && styles.abaAtiva]} 
          onPress={() => setAbaAtiva('projeto')}
        >
          <Text style={[styles.abaTexto, abaAtiva === 'projeto' && styles.abaTextoAtivo]}>
            Projetos ({projetos.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Listagem com FlatList */}
      <FlatList
        data={obterListaExibida()}
        keyExtractor={(item) => item.id}
        renderItem={renderItemCard}
        contentContainerStyle={styles.listaConteudo}
        ListEmptyComponent={
          <ListaVazia tipo={abaAtiva}/>
        }
        ListFooterComponent={renderFooter}
      />
    </View>
  );
}

// Estilização Nativa (StyleSheet)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  voltar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    marginLeft: 20,
    marginTop: 30
  },
  loadingTexto: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  headerTitulo: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    color: '#333',
  },
  abasContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    backgroundColor: '#fff',
  },
  abaBotao: {
    paddingVertical: 12,
    flex: 1,
    alignItems: 'center',
  },
  abaAtiva: {
    borderBottomWidth: 3,
    borderBottomColor: '#007bff',
  },
  abaTexto: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  abaTextoAtivo: {
    color: '#007bff',
    fontWeight: 'bold',
  },
  listaConteudo: {
    padding: 15,
  },
  fallbackVazio: {
    textAlign: 'center',
    color: '#999',
    marginTop: 40,
    fontSize: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 12,
    elevation: 2, // Sombra para Android
    shadowColor: '#000', // Sombra para iOS
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  perfilContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  foto: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  infoContainer: {
    flex: 1,
  },
  nome: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  subtexto: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  seta: {
    fontSize: 18,
    color: '#ccc',
  },
  projetoContainer: {
    flexDirection: 'row',
  },
  tituloProjeto: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  ementa: {
    fontSize: 14,
    color: '#555',
    lineHeight: 18,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#e1f5fe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 8,
  },
  badgeTexto: {
    color: '#0288d1',
    fontSize: 12,
    fontWeight: 'bold',
  },
  botaoFooter: {
    backgroundColor: '#00A651', // Verde combinando com a seta de voltar, ou use #007bff
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    marginBottom: 30, // Margem inferior para não colar na borda da tela
  },
  botaoFooterTexto: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});