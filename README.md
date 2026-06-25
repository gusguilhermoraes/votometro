# Votômetro

Este repositório contém o código-fonte do aplicativo **Votômetro**, desenvolvido para a disciplina de **Projeto Interdisciplinar II**.

Para consultar a documentação completa do projeto, acesse: [gusguilhermoraes/votometro-documentacao](https://github.com/gusguilhermoraes/votometro-documentacao)

---

## 📱 Como Usar (Usuário)

Para realizar o download do APK do Votômetro e testar o aplicativo diretamente no seu dispositivo Android, [clique aqui para acessar o Google Drive](https://drive.google.com/drive/folders/1WFq98ET-e_lB_-RAiLlHqdyaw1vCZSP2?usp=sharing).

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