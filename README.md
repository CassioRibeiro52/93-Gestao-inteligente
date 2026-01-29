
# 🚀 Gestão 93 - Guia de Publicação

Este projeto foi desenvolvido com as tecnologias mais modernas de frontend (React 19 + Gemini IA). Siga os passos abaixo para colocar sua loja online.

## 🛠 Como rodar no seu computador
1. Instale o [Node.js](https://nodejs.org/).
2. Baixe os arquivos do projeto para uma pasta.
3. Abra o terminal na pasta e digite:
   ```bash
   npm install
   npm run dev
   ```
4. O sistema abrirá em `http://localhost:5173`.

## 🌐 Como publicar na Internet (Vercel - Recomendado)
A Vercel é gratuita e extremamente rápida.
1. Crie uma conta em [vercel.com](https://vercel.com/).
2. Instale a Vercel CLI ou conecte seu repositório do GitHub.
3. Se usar a CLI, digite `vercel` no terminal da pasta do projeto.
4. **IMPORTANTE**: Nas configurações do projeto na Vercel, adicione a variável de ambiente:
   - `API_KEY`: (Sua chave do Google Gemini API)

## 📱 Transformar em Aplicativo (PWA)
Este sistema já possui o arquivo `manifest.json`. Ao acessar pelo celular no Chrome ou Safari, basta clicar em:
- **Compartilhar** -> **Adicionar à Tela de Início**.
- O ícone da Gestão 93 aparecerá como um app nativo no seu celular.

## 🔒 Segurança
- Os dados são salvos no **LocalStorage**. 
- Lembre-se sempre de usar a função de **Backup JSON** na aba Ajustes antes de trocar de aparelho.
