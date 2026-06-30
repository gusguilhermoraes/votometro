<div align="center">
  <a href="https://git.io/typing-svg"><img src="https://readme-typing-svg.demolab.com?font=Fira+Code&size=40&duration=1000&pause=1000&color=002060&center=true&vCenter=true&repeat=false&width=230&lines=Vot%C3%B4metro" alt="Typing SVG" /></a>
    <br />
    <a href="https://github.com/gusguilhermoraes/votometro">
      <img src="https://github.com/gusguilhermoraes/votometro-documentacao/blob/main/Logotipo/Banner%20-%20Votometro.png" alt="Projeto Votômetro">
    </a>
  </h1>
</div>

<p align="center">
  <a href="#LICENSE"><img src="https://img.shields.io/badge/license-%20%20GNU%20GPLv3%20-green"></a>
</p>

## Introdução

Este repositório contém o código-fonte do aplicativo **Votômetro**, desenvolvido para a disciplina de **Projeto Interdisciplinar II**. O projeto consiste em um aplicativo mobile, desenvolvido para o sistema Android utilizando React Native, Node.js e Firebase, de pesquisa de candidatos e acompanhamento do trabalho parlamentar.

Para consultar a documentação completa do projeto, acesse: [gusguilhermoraes/votometro-documentacao](https://github.com/gusguilhermoraes/votometro-documentacao)

---

## 🛠️ Como Executar o Projeto (Desenvolvedor)

> ⚠️ **Aviso:** O código disponibilizado está sem as chaves de API por motivos de segurança. Antes de iniciar, crie um arquivo `.env` na raiz do projeto e adicione as suas credenciais.

Siga os passos abaixo no seu terminal para rodar o projeto localmente:

1. **Instalar as dependências:**
   ```bash
   npm install

2. **Configurar as Variáveis de Ambiente:**
   Na raiz do projeto, faça uma cópia do arquivo ".env.example" e renomeie a cópia para ".env".
   
   Abra o novo arquivo ".env" e substitua os campos "[insira aqui]" pelas suas respectivas chaves do Firebase/Expo.

3. **Iniciar o aplicativo (Android):**
   ```bash
   npx expo run:android
