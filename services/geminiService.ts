
import { GoogleGenAI } from "@google/genai";
import { Sale, Customer } from "../types";

// Função para obter a chave de forma segura
const getApiKey = () => {
  try {
    return process.env.API_KEY || "";
  } catch (e) {
    return "";
  }
};

const apiKey = getApiKey();
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const COOLDOWN_TIME = 60000; 
let cooldownUntil = 0;

export const getFinancialInsights = async (
  sales: Sale[],
  customers: Customer[]
) => {
  if (!ai) return "⚠️ Inteligência Artificial aguardando configuração de chave.";

  const now = Date.now();
  if (now < cooldownUntil) {
    const secondsLeft = Math.ceil((cooldownUntil - now) / 1000);
    return `⚠️ IA em repouso. Tente novamente em ${secondsLeft}s.`;
  }

  if (sales.length === 0) return "Registre vendas para análise da IA.";

  const context = {
    s: sales.length,
    v: sales.reduce((acc, s) => acc + s.totalAmount, 0),
    c: customers.length,
    p: sales.flatMap(s => s.installments).filter(i => i.status !== 'PAID').length,
  };
  
  const cacheKey = `gemini_cache_${JSON.stringify(context)}`;
  const cached = sessionStorage.getItem(cacheKey);
  
  if (cached) return cached;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analise brevemente (máx 300 caracteres): Loja com ${context.s} vendas (R$ ${context.v}), ${context.c} clientes e ${context.p} parcelas abertas. Foque em saúde financeira.`,
      config: {
        temperature: 0.5,
        maxOutputTokens: 200,
      }
    });

    const text = response.text || "Insights indisponíveis no momento.";
    sessionStorage.setItem(cacheKey, text);
    return text;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    if (error?.message?.includes("429") || error?.status === 429) {
      cooldownUntil = Date.now() + COOLDOWN_TIME;
      return "⚠️ Limite de cota atingido. IA em pausa de 1 min.";
    }
    
    return "Nota: IA temporariamente offline.";
  }
};
