# Votometro
Projeto de desenvolvimento de aplicativo de pesquisa de candidatos das eleições brasileiras e acompanhamento do trabalho parlamentar

# Logotipo
<img alt="Logotipo do Votômetro" src="/Logotipo/Logotipo - Votometro.png" />

# Objetivo geral
Desenvolver um aplicativo para pesquisa, análise e escolha de candidatos nas eleições e para fortalecimento da participação popular nos temas parlamentares fora do período eleitoral.

# Justificativa
O aplicativo Votômetro tem como objetivo o apoio ao eleitor na escolha do seu candidato, com base no princípio da transparência. Ele será fundamental para empoderar o cidadão, permitindo que ele possa votar em quem, de fato, está alinhado com seus princípios. Minorias e grupos desfavorecidos também poderiam se beneficiar do aplicativo, ao poder aproximar seus eleitores e candidatos que apoiem seus interesses. O alto índice de indecisão pré eleição também poderia ser reduzido, através da recomendação de candidatos com base nos filtros de pesquisa estabelecidos pelo eleitor, que delimitam candidatos por região, propostas, ideologia ou causas defendidas.
O Votômetro também contribui na redução da corrupção, por meio da análise do histórico político do candidato e da consulta acerca de escândalos envolvendo o mesmo. Envolvimento com esquemas de corrupção, crimes cometidos pelo candidato no passado ou mesmo indícios de ligações do candidato com facções criminosas, milícias ou grupos extremistas seriam exibidas ao eleitor, tudo com base em fontes confiáveis, como notícias de jornais consolidados. O aplicativo em si não apontaria diretamente o candidato como culpado, para evitar problemas judiciais, mas exibirá as notícias de jornais relevantes e checadores de fatos, com uma opção para o usuário sinalizar caso uma notícia que aparece no aplicativo seja falsa.
Posteriormente a eleição, o aplicativo deverá mostrar o trabalho do candidato como político, mostrando seus dados de contato, gastos, votos, projetos apresentados, discursos, notícias, entre outros, por meio de uma interface intuitiva e com filtros temáticos que personalizam a análise dos objetos de pesquisa. A possibilidade de acompanhar o trabalho parlamentar e as propostas debatidas, juntamente com a oferta de ferramentas de contato, estimulam o uso do engajamento político direto dos eleitores. Ao fortalecer esse engajamento, o Votômetro contribui para um cenário de maior participação popular na democracia. Casos recentes, como a pressão popular contra a Proposta de Emenda à Constituição nº 3, de 2021, demonstram o impacto do engajamento cívico no desenvolvimento do país e fortalecimento da democracia (Pereira, 2025), evidenciando a relevância do Votômetro.
Nessa temática, o acompanhamento das promessas de campanha se constitui como uma importante ferramenta. Atualmente, existem poucas formas práticas de acompanhar se as propostas feitas nas eleições foram cumpridas ou não, com destaque para o monitoramento “As promessas dos políticos”, feito pelo G1, focado no acompanhamento de promessas de campanha de prefeitos de capitais. O Votômetro exibirá, na tela de perfil do político, as suas promessas feitas em campanha, coletadas tanto dos documentos oficiais de plano de governo disponibilizados pelo TSE quanto de entrevistas e declarações em redes sociais. Com base nessa lista e nos demais dados fornecidos pelo aplicativo, o eleitor poderá julgar se o plano apresentado na eleição está sendo cumprido ou não.

# Escopo
- O sistema deve permitir o cadastro de usuários
- O sistema deve permitir o cadastro de projetos
- O sistema deve atender ou fornecer os devidos parâmetros para as API’s utilizadas
- O sistema deve permitir que o usuário realize pesquisas de candidatos, políticos ou projetos
- O sistema deve emitir relatórios

# Publico alvo
O público alvo do aplicativo são os eleitores que buscam informações para definir o candidato que irá escolher. Esse grupo inclui pessoas de diversas classes e grupos sociais diferentes, todos com o mesmo objetivo de definir suas escolhas eleitorais e votar na esperança de gerar mudanças na cidade, estado e país onde vivem, e também acompanhar o trabalho parlamentar e entrar em contato com eles para pressionar por mudanças.

# Descrição do projeto
No contexto eleitoral brasileiro atual, muitos eleitores enfrentam dificuldades na hora de votar e acompanhar o trabalho dos seus candidatos eleitos. Esses obstáculos, como informação fragmentada e, muitas vezes, difícil de se encontrar, influenciam em altas taxas de indecisão eleitoral, com muitos eleitores deixando para escolher o candidato apenas no dia da eleição. Visando resolver esse problema, o aplicativo Votômetro traz a ideia de pesquisa filtrada e personalizada de candidatos, comparação de projetos, acompanhamento de informações sobre o trabalho político pós-eleição, entre outros. Com isso, espera-se que o projeto se torne uma importante ferramenta de auxílio ao cidadão, garantindo o voto com confiança e reforçando a participação popular na política cotidiana.
Para a parte da programação e desenvolvimento dos sistemas, será utilizado o programa Visual Studio Code, juntamente com a linguagem de programação React Native, que permitirá o desenvolvimento multiplataforma do aplicativo. A etapa de testes será realizada usando o Android Studio, que permite a execução do aplicativo desenvolvido, emulando um dispositivo móvel. Após os testes serem realizados e ser atestado o funcionamento correto do código desenvolvido, ele será publicado na plataforma GitHub.
Para coletar os dados relacionados, o sistema consumirá as APIs do TSE e de órgãos legislativos, como a Câmara dos Deputados e o Senado Federal. Para além dessas fontes, também haverá coleta de dados de jornais e redes sociais, visando levantar notícias e propostas dos candidatos. Após a coleta, os dados passarão por um processo de tratamento, para conferência de veracidade, e também organização, visando facilitar a leitura pelo usuário final.
O sistema de banco de dados do projeto será desenvolvido usando a plataforma Firebase, visando armazenar os dados persistentes necessários para o funcionamento do aplicativo, incluindo informações de candidatos e parlamentares, notícias, promessas de campanha, projetos de lei, entre outros.


# Composição do grupo do projeto
- Gustavo Guilherme de Moraes
- Lucas Fernando Mendes de Almeida

# Alinhamento com ODS
Em relação aos Objetivos de Desenvolvimento Sustentável da Organização das Nações Unidas, o projeto se alinha com a ODS 16, o objetivo de alcançar Paz, Justiça e Instituições Eficazes. Essa ligação ocorre devido ao propósito do aplicativo em ajudar os cidadãos na escolha de seus representantes, o que levaria as instituições a se tornarem mais próximas do povo, assim, aumentando a sua eficácia.

# Licenças de uso
GNU General Public License v3.0
