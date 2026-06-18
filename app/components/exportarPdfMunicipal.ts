import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';

interface Candidato {
  nome: string;
  partido: string;
  cargo: string;
  numero: string;
  foto: string;
}

interface DadosRelatorio {
  tipo: string;
  prefeito: Candidato | null;
  vereador: Candidato | null;
}

export const gerarPDFEleicaoMunicipal = async (dados: DadosRelatorio) => {
  // Define os textos caso o usuário opte por deixar em branco
  const nomePrefeito = dados.prefeito ? dados.prefeito.nome : 'VOTO EM BRANCO / NÃO SELECIONADO';
  const partidoPrefeito = dados.prefeito ? dados.prefeito.partido : '-';

  const nomeVereador = dados.vereador ? dados.vereador.nome : 'VOTO EM BRANCO / NÃO SELECIONADO';
  const partidoVereador = dados.vereador ? dados.vereador.partido : '-';

  const digitosPrefeito = dados.prefeito && dados.prefeito.numero 
    ? dados.prefeito.numero.split('') 
    : [' ', ' '];

  const digitosVereador = dados.vereador && dados.vereador.numero 
    ? dados.vereador.numero.split('') 
    : [' ', ' ', ' ', ' ', ' '];

  // 3. Geração dinâmica das caixinhas de dígitos usando .map()
  const htmlDigitosPrefeito = digitosPrefeito
    .map(digito => `<div class="digito">${digito}</div>`)
    .join('');

  const htmlDigitosVereador = digitosVereador
    .map(digito => `<div class="digito">${digito}</div>`)
    .join('');

  const logoVotometro = "https://firebasestorage.googleapis.com/v0/b/votometro-adad1.firebasestorage.app/o/logos%2Fvotometro%2Flogo-splash.png?alt=media&token=7766aa35-c173-4e39-ab93-1ca82510d674";
  const fotoPrefeito = dados.prefeito && dados.prefeito.foto
  const fotoVereador = dados.vereador && dados.vereador.foto

  // Template HTML estruturado e estilizado com CSS embutido
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Cartão de Votação - Votômetro</title>
        <style>
            /* Configurações Gerais e de Visualização na Tela */
            body {
                font-family: 'Helvetica Neue', Arial, sans-serif;
                background-color: #f0f2f5;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                margin: 0;
            }

            .data-geracao {
                font-size: 11px;
                color: #666;
                margin-bottom: 8px;
            }

            /* O Cartãozinho (Tamanho ideal para carteira/bolso) */
            .cartao-votacao {
                width: 9cm;
                height: 14cm;
                background-color: #ffffff;
                border: 2px dashed #ccc;
                padding: 15px;
                box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                box-sizing: border-box;
                position: relative;
            }

            /* Topo: Logos */
            .topo-cartao {
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 2px solid #0047ab;
                padding-bottom: 8px;
            }

            .logo-votometro {
                height: 35px;
                object-fit: contain;
            }

            .logo-partido {
                height: 30px;
                object-fit: contain;
            }

            /* Seções de Candidatos */
            .secao-candidato {
                margin-top: 12px;
                flex-grow: 1;
            }

            .titulo-cargo {
                font-size: 11px;
                text-transform: uppercase;
                color: #0047ab;
                font-weight: bold;
                letter-spacing: 1px;
                margin-bottom: 6px;
                border-left: 3px solid #0047ab;
                padding-left: 5px;
            }

            .dados-candidato {
                display: flex;
                align-items: center;
                gap: 12px;
            }

            .foto-candidato {
                width: 55px;
                height: 70px;
                border: 1px solid #aaa;
                background-color: #eee;
                object-fit: cover;
            }

            .info-voto {
                display: flex;
                flex-direction: column;
                gap: 6px;
            }

            .nome-candidato {
                font-size: 13px;
                font-weight: bold;
                color: #222;
                max-width: 180px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .partido-candidato {
                font-size: 12px;
                color: #555;
                margin-bottom: 4px;
            }

            /* Caixinhas dos Números (Estilo Urna) */
            .container-numeros {
                display: flex;
                gap: 4px;
            }

            .digito {
                width: 24px;
                height: 30px;
                border: 2px solid #333;
                display: flex;
                justify-content: center;
                align-items: center;
                font-size: 18px;
                font-weight: bold;
                background-color: #fafafa;
                color: #111;
            }

            /* Rodapé decorativo */
            .rodape-cartao {
                text-align: center;
                font-size: 9px;
                color: #777;
                border-top: 1px solid #eee;
                padding-top: 6px;
            }

            /* --- CONFIGURAÇÕES DE IMPRESSÃO --- */
            @media print {
                body {
                    background-color: transparent;
                }
                .data-geracao {
                    display: none; /* Opcional: oculta a data solta fora do cartão na impressão */
                }
                .cartao-votacao {
                    box-shadow: none;
                    border: 2px dashed #000;
                    page-break-inside: avoid;
                }
                @page {
                    size: auto;
                    margin: 0mm;
                }
            }
        </style>
    </head>
    <body>
        <div class="cartao-votacao">
            
            <div class="topo-cartao">
                <img class="logo-votometro" src="${logoVotometro}" alt="Logo Votômetro" onerror="this.src='https://via.placeholder.com/100x35?text=Votômetro'">
                <div class="data-geracao">Gerado em: ${new Date().toLocaleDateString('pt-BR')}</div>
            </div>

            <div class="secao-candidato">
                <div class="titulo-cargo">Prefeito</div>
                <div class="dados-candidato">
                    <img class="foto-candidato" src="${fotoPrefeito}" alt="Foto Prefeito" onerror="this.src='https://via.placeholder.com/55x70?text=Foto'">
                    <div class="info-voto">
                        <div class="nome-candidato">${nomePrefeito}</div>
                        <div class="partido-candidato">${partidoPrefeito}</div>
                        <div class="container-numeros">
                            ${htmlDigitosPrefeito}
                        </div>
                    </div>
                </div>
            </div>

            <div class="secao-candidato">
                <div class="titulo-cargo">Vereador</div>
                <div class="dados-candidato">
                    <img class="foto-candidato" src="${fotoVereador}" alt="Foto Vereador" onerror="this.src='https://via.placeholder.com/55x70?text=Foto'">
                    <div class="info-voto">
                        <div class="nome-candidato">${nomeVereador}</div>
                        <div class="nome-candidato">${partidoVereador}</div>
                        <div class="container-numeros">
                            ${htmlDigitosVereador}
                        </div>
                    </div>
                </div>
            </div>

            <div class="rodape-cartao">
                Confira sua colinha antes de votar.
            </div>

        </div>
    </body>
    </html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({ html: htmlContent });
    
    if (Platform.OS === 'ios') {
      await Sharing.shareAsync(uri);
    } else {
      await Sharing.shareAsync(uri, { MIMEType: 'application/pdf', dialogTitle: 'Salvar sua Colinha' });
    }
  } catch (error) {
    console.error("Erro ao gerar PDF", error);
    throw error;
  }
};