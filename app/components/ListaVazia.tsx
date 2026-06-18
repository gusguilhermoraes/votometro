import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router'; 

interface ListaVaziaProps {
  tipo: string;
}

interface ItemConfig {
  tipo: string;
  titulo: string;
  descricao: string;
  textoBotao: string;
  linkFinal: string;
}

const ListaVaziaItems: ItemConfig[] = [
  {
    tipo: 'candidato',
    titulo: 'Nenhum candidato favoritado',
    descricao: 'Adicione candidatos aos seus favoritos para encontrá-los aqui com facilidade',
    textoBotao: 'Explorar candidatos',
    linkFinal: '/candidatos/pesquisaCandidato'
  },
  {
    tipo: 'politico',
    titulo: 'Nenhum político favoritado',
    descricao: 'Adicione políticos aos seus favoritos para encontrá-los aqui com facilidade',
    textoBotao: 'Explorar políticos',
    linkFinal: '/politicos/pesquisaPolitico'
  },
  {
    tipo: 'projeto',
    titulo: 'Nenhum projeto favoritado',
    descricao: 'Adicione projetos aos seus favoritos para encontrá-los aqui com facilidade',
    textoBotao: 'Explorar projetos',
    linkFinal: '/projetos/pesquisaProjeto'
  }
];

export default function ListaVazia({ tipo }: ListaVaziaProps) {
    const router = useRouter();

    const dadosAtuais = ListaVaziaItems.find(item => item.tipo === tipo);

    if (!dadosAtuais) {
        return null; 
    }

    return (
        <View style={styles.emptyContainer}>
            <View style={styles.iconContainer}>
                <Ionicons name="bookmark" size={80} color="#009C3B" />
            </View>

            <Text style={styles.emptyTitle}>
                {dadosAtuais.titulo}
            </Text>

            <Text style={styles.emptyDescription}>
                {dadosAtuais.descricao}
            </Text>

            <TouchableOpacity
                style={styles.button}
                activeOpacity={0.7}
                onPress={() => router.push(dadosAtuais.linkFinal as any)}
            >
                <Ionicons name="add" size={24} color="#fff" />
                <Text style={styles.buttonText}>
                    {dadosAtuais.textoBotao}
                </Text>
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 80,
  },

  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#F2FAF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },

  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#002776',
    textAlign: 'center',
    marginBottom: 12,
  },

  emptyDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },

  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#009C3B',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },

  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});