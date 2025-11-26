# Votometro
Projeto de desenvolvimento de aplicativo de pesquisa de candidatos das eleições brasileiras e acompanhamento do trabalho parlamentar

# 1. Identificação
## Identidade visual do projeto
<img alt="Logotipo do Votômetro" src="/Logotipo/Logotipo - Votometro - Menor.png" />

## Equipe
- Gustavo Guilherme de Moraes
- Lucas Fernando Mendes de Almeida

## Data de criação do projeto
11/08/2025

# 2. Concepção
## Descrição da visão geral do projeto 
No contexto eleitoral brasileiro atual, muitos eleitores enfrentam dificuldades na hora de votar e acompanhar o trabalho dos seus candidatos eleitos. Esses obstáculos, como informação fragmentada e, muitas vezes, difícil de se encontrar, influenciam em altas taxas de indecisão eleitoral, com muitos eleitores deixando para escolher o candidato apenas no dia da eleição. Visando resolver esse problema, o aplicativo Votômetro traz a ideia de pesquisa filtrada e personalizada de candidatos, comparação de projetos, acompanhamento de informações sobre o trabalho político pós-eleição, entre outros. Com isso, espera-se que o projeto se torne uma importante ferramenta de auxílio ao cidadão, garantindo o voto com confiança e reforçando a participação popular na política cotidiana.

## Objetivo geral do projeto
Desenvolver um aplicativo para pesquisa, análise e escolha de candidatos nas eleições e para fortalecimento da participação popular nos temas parlamentares fora do período eleitoral.

## Escopo
### Descrição do produto
O produto final será um aplicativo de apoio ao eleitor, que auxilie na decisão de voto de eleitores e na ampliação da participação cidadã no trabalho parlamentar, por meio da aproximação dos eleitores com os políticos eleitos.
O produto final deverá atender os seguintes requisitos:
- O sistema deve permitir que o usuário realize pesquisas de candidatos, políticos ou projetos. Essas pesquisas terão filtros, como nome, cargo, partido, entre outros, que limitarão a pesquisa para retornar o que o usuário deseja.
- O sistema terá telas dinâmicas de candidatos, projetos e políticos, que terão os seus dados exibidos alterados de acordo com o candidato, projeto ou político acessado. Essas informações serão puxadas tanto do Banco de Dados do próprio Votômetro quanto de APIs dos órgãos legislativos e eleitorais.
- O sistema permitirá ao usuário acessar e acompanhar as propostas feitas pelo político em sua campanha, com botões para acesso das fontes.
- O sistema mostrará notícias sobre o candidato/político, visando permitir ao eleitor conferir o histórico do candidato/político. O aplicativo aceitará apenas notícias que venham de fontes previamente aprovadas em curadoria interna, e o usuário poderá reportar a notícia para a moderação caso ela esteja desatualizada ou não seja verdadeira.
- O sistema permitirá ao usuário acessar projetos de lei e conferir seu estado atual, podendo conferir os votos de cada parlamentar a cada projeto.
- O usuário poderá favoritar candidatos e gerar uma lista de candidatos favoritos, que poderá ser impressa e levada a cabine eleitoral para auxílio na hora do voto.

### Principais entregas
Documento 1 - Referêncial e base teórica do projeto;
Documento 2 - Requisitos, diagramas UML e planos de testes;
Entrega do repositório no GitHub;

### Critérios de aceite
- As funções de pesquisa estão funcionais?
- O usuário consegue chegar aos perfís dos candidatos que ela desejou encontrar inicialmente?
- O usuário possui acesso as propostas, notícias, entre outras informações cruciais para poder definir o seu voto?
- O sistema não exibe informações atrasadas?

# 3. Design do software 
## Design Centrado no Usuário
O projeto será desenvolvido usando conceitos de Design Centrado no Usuário, visando desenvolver um aplicativo acessível e de fácil uso. As telas de políticos, candidatos e projetos serão acessíveis com poucos toques na tela.

## Persona
Com base nos resultados do formulário de pesquisa, foi formulado a persona de um usuário médio do Votômetro: Maria.
Mais informações sobre a persona podem ser conferidas em: <a href="Persona - Votometro.pdf">Persona</a>

## Storyboard
A partir da persona desenvolvida e dos casos de uso planejados do aplicativo, foi desenvolvido um storyboard que mostra o uso prático do Votômetro.
Mais informações sobre o storyboard podem ser conferidas em: <a href="Storyboard/Storyboard - Votometro.pdf">Storyboard</a>


## UI Design (guia de estilo)
O protótipo do aplicativo foi desenvolvido usando a plataforma Figma. Ele usará as cores da bandeira do Brasil como estilo de plano de fundo (verde: #009440; amarelo: #ffcb00).

## Protótipo
O protótipo do aplicativo pode ser acessado em: [Protótipo](https://www.figma.com/proto/cnACOIzrx8xnG3JlUbXXom/Votometro?node-id=0-1&t=47jg256w5Mcc846J-1)

## Plano de testes
O plano de testes do aplicativo deverá englobar as funções de pesquisa e busca de informações. Os testes deverão verificar se a pesquisa funciona da forma correta e se as informações associadas ao político/candidato/projeto acessado pelo usuário estão sendo corretamente coletadas do banco de dados/APIs.

# 4. Desenvolvimento

## Modelo de processo de software
O projeto será desenvolvido usando metodologia hibrida, mesclando características de vários modelos, como o cascata e o ágil.
O projeto será desenvolvido seguindo uma rota linear: primeiro a etapa de conceituação, depois a de prototipação, depois as etapas de desenvolvimento e testes do produto final, em conjunto.
As entregas do produto final serão feitas de forma contínua e incremental.

## Recursos utilizados
Serão utilizados os seguintes recursos no desenvolvimento do software:
- Visual Studio Code - Desenvolvimento dos códigos
- Android Studio - Emulação do ambiente Android
- Canva - Desenvolvimento do Storyboard
- LucidChart - Desenvolvimento dos diagramas
- React Native - Linguagem de desenvolvimento mobile
- GitHub - Repositório do projeto
- Firebase - Banco de dados
- API TSE - Coleta de dados relacionados a candidatos
- API da Câmara dos Deputados - Coleta de dados relacionados a deputados federais
- API do Senado Federal - Coleta de dados relacionada a senadores
- API da Assembleia Legislativa do Estado do Paraná - Coleta de dados relacionada a deputados estaduais do Paraná
- Jornais e redes sociais - Coleta de dados relacionada a notícias e propostas dos candidatos

## Resultados esperados
Espera-se que o Votômetro seja uma poderosa ferramenta de auxílio no exercício da cidadania. Espera-se que ele aprimore a participação popular na política parlamentar cotidiana, através do aprimoramento do contato entre cidadãos e políticos. Espera-se também que o usuário do aplicativo passe a se tornar mais satisfeito com o seu voto e com o seu próprio impacto na política local e na melhoria do local onde vive.

## Licenças de uso
GNU General Public License v3.0

# 5. Outros

## Público alvo
O público alvo do aplicativo são os eleitores que buscam informações para definir o candidato que irá escolher. Esse grupo inclui pessoas de diversas classes e grupos sociais diferentes, todos com o mesmo objetivo de definir suas escolhas eleitorais e votar na esperança de gerar mudanças na cidade, estado e país onde vivem, e também acompanhar o trabalho parlamentar e entrar em contato com eles para pressionar por mudanças.

## Alinhamento com ODS
Em relação aos Objetivos de Desenvolvimento Sustentável da Organização das Nações Unidas, o projeto se alinha com a ODS 16, o objetivo de alcançar Paz, Justiça e Instituições Eficazes. Essa ligação ocorre devido ao propósito do aplicativo em ajudar os cidadãos na escolha de seus representantes, o que levaria as instituições a se tornarem mais próximas do povo, assim, aumentando a sua eficácia.
