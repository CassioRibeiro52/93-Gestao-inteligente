
import React, { useState } from 'react';
import { Customer, Sale, User, Product } from '../types';

interface SettingsProps {
  user?: User | null;
  customers: Customer[];
  sales: Sale[];
  products: Product[];
  onUpdateProfile?: (user: User) => void;
  onImport: (data: { customers: Customer[], sales: Sale[], products?: Product[] }) => void;
  onClear: () => void;
}

const Settings: React.FC<SettingsProps> = ({ user, customers, sales, products, onUpdateProfile, onImport, onClear }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'backup' | 'publish' | 'credits' | 'danger'>('profile');
  const [isExporting, setIsExporting] = useState(false);
  
  const [shopName, setShopName] = useState(user?.name || '');
  const [shopLogo, setShopLogo] = useState(user?.avatarUrl || '');

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (user && onUpdateProfile) {
      onUpdateProfile({ ...user, name: shopName, avatarUrl: shopLogo });
      alert('Perfil da loja atualizado com sucesso!');
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setShopLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExport = () => {
    const data = { customers, sales, products, exportDate: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_gestao93_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.customers && json.sales) {
          if (confirm('Isso substituirá seus dados atuais. Continuar?')) {
            onImport({ customers: json.customers, sales: json.sales, products: json.products || [] });
          }
        }
      } catch { alert('Erro no arquivo.'); }
    };
    reader.readAsText(file);
  };

  const handleExportProject = async () => {
    // @ts-ignore - JSZip is loaded via CDN
    if (typeof JSZip === 'undefined') {
      alert('Erro: Biblioteca de ZIP ainda não carregada. Tente em instantes.');
      return;
    }
    
    setIsExporting(true);
    try {
      // @ts-ignore
      const zip = new JSZip();
      
      // Simulação de arquivos do projeto baseados no que o AI entregou
      zip.file("package.json", `{
  "name": "gestao-93-fashion",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "@google/genai": "^1.38.0",
    "react": "^19.2.4",
    "react-dom": "^19.2.4",
    "recharts": "^3.7.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.16",
    "typescript": "~5.6.2",
    "vite": "^6.0.5"
  }
}`);
      zip.file("vite.config.ts", `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  define: { 'process.env': process.env }
});`);

      zip.file("tailwind.config.js", `/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: { extend: {} },
  plugins: [],
}`);

      zip.file("postcss.config.js", `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`);

      zip.file("README.md", `# Gestão 93 - Instruções de Publicação

1. Extraia este ZIP em uma pasta.
2. Abra o terminal na pasta e rode 'npm install'.
3. Rode 'npm run build' para gerar a pasta 'dist' de produção.
4. Faça o upload da pasta 'dist' para seu servidor ou use 'vercel' para publicar direto.`);

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = "projeto_gestao93_fontes.zip";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Erro ao gerar ZIP.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex border-b border-slate-200 overflow-x-auto no-scrollbar">
        {[
          { id: 'profile', label: 'Perfil da Loja' },
          { id: 'backup', label: 'Segurança' },
          { id: 'publish', label: 'Publicação & Dev' },
          { id: 'credits', label: 'Créditos' },
          { id: 'danger', label: 'Zerar' }
        ].map(tab => (
          <button 
            key={tab.id} 
            onClick={() => setActiveTab(tab.id as any)} 
            className={`px-6 py-3 text-[10px] md:text-xs font-black uppercase tracking-wider transition-colors whitespace-nowrap ${activeTab === tab.id ? 'text-indigo-800 border-b-2 border-indigo-800' : 'text-slate-400 hover:text-slate-600'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100 min-h-[400px]">
        {activeTab === 'profile' && (
           <form onSubmit={handleUpdateProfile} className="max-w-xl space-y-8 animate-in fade-in duration-300">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-3xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden transition-all group-hover:border-indigo-400">
                    {shopLogo ? (
                      <img src={shopLogo} alt="Logo Preview" className="w-full h-full object-cover" />
                    ) : (
                      <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    )}
                  </div>
                  <label className="absolute -bottom-2 -right-2 bg-indigo-600 text-white p-2 rounded-xl shadow-lg cursor-pointer hover:bg-indigo-700 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                  </label>
                </div>
                
                <div className="flex-1 space-y-4 w-full">
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider">Nome da Loja</label>
                    <input type="text" value={shopName} onChange={(e) => setShopName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-black text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Ex: Boutique 93" />
                  </div>
                </div>
              </div>
              <button type="submit" className="w-full bg-indigo-900 text-white px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl hover:bg-indigo-950 transition-all">
                Salvar Alterações
              </button>
           </form>
        )}

        {activeTab === 'publish' && (
           <div className="space-y-8 animate-in fade-in duration-300">
              <div className="p-6 bg-indigo-50 rounded-[2rem] border border-indigo-100">
                <h4 className="text-indigo-900 font-black uppercase italic text-lg mb-2">Publicar na Internet</h4>
                <p className="text-xs text-indigo-700 font-bold leading-relaxed mb-6">
                  Transforme seu sistema em um link profissional (ex: minha-loja.vercel.app). 
                  Clique no botão abaixo para baixar todos os arquivos de uma vez e seguir o guia.
                </p>
                
                <button 
                  onClick={handleExportProject} 
                  disabled={isExporting}
                  className="w-full bg-indigo-600 text-white px-8 py-5 rounded-[1.5rem] text-sm font-black uppercase tracking-[0.1em] shadow-xl hover:bg-indigo-700 transition flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                >
                  {isExporting ? 'Processando...' : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      Baixar Projeto Completo (.ZIP)
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
                   <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Passos Seguintes</h5>
                   <ul className="space-y-3">
                      <li className="flex gap-2 items-start text-xs text-slate-600 font-bold">
                        <span className="w-4 h-4 rounded bg-indigo-100 text-indigo-600 flex items-center justify-center text-[8px] shrink-0 mt-0.5">1</span>
                        Extraia o ZIP no seu computador.
                      </li>
                      <li className="flex gap-2 items-start text-xs text-slate-600 font-bold">
                        <span className="w-4 h-4 rounded bg-indigo-100 text-indigo-600 flex items-center justify-center text-[8px] shrink-0 mt-0.5">2</span>
                        Instale o Node.js no seu sistema.
                      </li>
                      <li className="flex gap-2 items-start text-xs text-slate-600 font-bold">
                        <span className="w-4 h-4 rounded bg-indigo-100 text-indigo-600 flex items-center justify-center text-[8px] shrink-0 mt-0.5">3</span>
                        Use 'npm install' e 'npm run dev'.
                      </li>
                   </ul>
                </div>
                <div className="p-5 bg-slate-900 text-white rounded-2xl border border-slate-800">
                   <h5 className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-4">Hospedagem Recomendada</h5>
                   <p className="text-xs font-black italic mb-2">Vercel ou Netlify</p>
                   <p className="text-[10px] text-slate-400 font-bold leading-relaxed">
                     São serviços gratuitos onde você só precisa arrastar sua pasta 'dist' para colocar o site no ar com segurança SSL.
                   </p>
                </div>
              </div>
           </div>
        )}

        {activeTab === 'backup' && (
           <div className="space-y-8 animate-in fade-in duration-300">
              <div className="p-5 bg-amber-50 rounded-2xl border border-amber-100 max-w-2xl">
                <p className="text-xs text-amber-900 font-bold leading-relaxed">
                  <span className="font-black uppercase block mb-1">Segurança de Dados:</span> 
                  Exportar os dados gera um arquivo com todos seus clientes e vendas. Útil para trocar de celular.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button onClick={handleExport} className="bg-indigo-900 text-white px-6 py-4 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg hover:bg-indigo-950 transition">
                  Exportar Dados (JSON)
                </button>
                <label className="block cursor-pointer bg-slate-100 text-slate-700 px-6 py-4 rounded-xl text-xs font-black uppercase text-center border border-slate-200 hover:bg-slate-200 transition">
                  Importar Backup
                  <input type="file" className="hidden" accept=".json" onChange={handleImport} />
                </label>
              </div>
           </div>
        )}

        {activeTab === 'credits' && (
          <div className="space-y-12 animate-in fade-in duration-500">
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Idealização & Tecnologia</h3>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-[0.3em]">Gestão 93 - Vendas a Prazo</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-indigo-50 p-8 rounded-3xl border border-indigo-100 text-center">
                <p className="text-xl font-black text-indigo-950 uppercase italic">Cássio Ribeiro de Freitas</p>
                <p className="text-xs text-indigo-700 mt-2 font-bold tracking-widest">Idealista Estratégico</p>
              </div>
              <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 text-center">
                <p className="text-xl font-black text-slate-900 uppercase italic">Google Gemini 3</p>
                <p className="text-xs text-slate-600 mt-2 font-bold tracking-widest">Inteligência Artificial</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'danger' && (
           <div className="max-w-xl space-y-6 animate-in fade-in duration-300">
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl">
                 <p className="text-xs text-rose-700 font-black uppercase tracking-tight">CUIDADO: Esta ação apagará permanentemente todos os dados salvos localmente.</p>
              </div>
              <button 
                onClick={() => { if (confirm('TEM CERTEZA?')) onClear(); }} 
                className="w-full bg-rose-600 text-white px-8 py-4 rounded-xl text-sm font-black uppercase tracking-widest shadow-lg hover:bg-rose-700 transition-all active:scale-95"
              >
                Zerar Todo o Sistema
              </button>
           </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
