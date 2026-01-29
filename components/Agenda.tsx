
import React from 'react';
import { Sale, Customer, PaymentStatus, Installment } from '../types';

interface AgendaProps {
  sales: Sale[];
  customers: Customer[];
  onPayInstallment: (saleId: string, installmentId: string, isPaying: boolean) => void;
}

interface GroupedInstallment extends Installment {
  customerName: string;
  saleDescription: string;
  installmentIndex: number;
  totalInstallments: number;
}

const Agenda: React.FC<AgendaProps> = ({ sales, customers, onPayInstallment }) => {
  const getAllInstallments = (): GroupedInstallment[] => {
    return sales.flatMap(sale => 
      sale.installments.map((inst, idx) => {
        const isCounterSale = sale.customerId === 'BALCAO';
        const customer = isCounterSale ? { name: '🛒 Venda Balcão' } : customers.find(c => c.id === sale.customerId);
        
        return {
          ...inst,
          customerName: customer?.name || 'Cliente Excluído',
          saleDescription: sale.description,
          installmentIndex: idx + 1,
          totalInstallments: sale.installments.length
        };
      })
    );
  };

  const groupedByMonth = getAllInstallments().reduce((acc, inst) => {
    const date = new Date(inst.dueDate);
    const monthYear = date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
    if (!acc[monthYear]) acc[monthYear] = [];
    acc[monthYear].push(inst);
    return acc;
  }, {} as Record<string, GroupedInstallment[]>);

  const sortedMonthKeys = Object.keys(groupedByMonth).sort((a, b) => {
    const parseMonth = (str: string) => {
      const [m, y] = str.split(' de ');
      return new Date(Date.parse(m + " 1, " + y)).getTime();
    };
    return parseMonth(a) - parseMonth(b);
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black text-slate-800 uppercase italic">Agenda Fashion</h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Controle de recebimentos futuros</p>
        </div>
      </div>

      {sortedMonthKeys.length === 0 && (
        <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-slate-200 text-slate-400 font-bold uppercase text-xs">
          Nenhum lançamento futuro.
        </div>
      )}

      {sortedMonthKeys.map(month => {
        const monthInstallments = groupedByMonth[month].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
        const monthTotal = monthInstallments.reduce((sum, i) => sum + i.amount, 0);
        const monthPaid = monthInstallments.reduce((sum, i) => sum + i.paidAmount, 0);

        return (
          <div key={month} className="space-y-4">
            <div className="flex justify-between items-end border-b-2 border-indigo-100 pb-2">
              <h3 className="text-lg font-black text-indigo-950 uppercase italic tracking-tighter capitalize">{month}</h3>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase">Previsão</p>
                <p className="text-sm font-black text-slate-700">
                  R$ {monthTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} 
                  <span className="text-xs text-emerald-600 ml-2"> (Rec: R$ {monthPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {monthInstallments.map(inst => {
                const isOverdue = inst.status !== PaymentStatus.PAID && new Date(inst.dueDate) < new Date();
                
                return (
                  <div key={inst.id} className={`bg-white p-5 rounded-3xl shadow-sm border-2 transition-all group ${inst.status === PaymentStatus.PAID ? 'border-emerald-100 bg-emerald-50/20' : isOverdue ? 'border-rose-100 bg-rose-50/20' : 'border-slate-100'}`}>
                    <div className="flex justify-between items-start mb-4">
                      <div className="max-w-[70%]">
                        <p className={`text-xs font-black truncate uppercase tracking-tight ${inst.customerName.includes('🛒') ? 'text-amber-600' : 'text-indigo-800'}`}>{inst.customerName}</p>
                        <p className="text-[10px] text-slate-400 truncate font-bold uppercase">{inst.saleDescription}</p>
                      </div>
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded-lg uppercase border ${
                        inst.status === PaymentStatus.PAID ? 'bg-emerald-500 text-white border-emerald-600' :
                        isOverdue ? 'bg-rose-500 text-white border-rose-600' : 'bg-amber-100 text-amber-700 border-amber-200'
                      }`}>
                        {inst.status === PaymentStatus.PAID ? 'Recebido' : isOverdue ? 'Atrasado' : 'Pendente'}
                      </span>
                    </div>

                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Vencimento</p>
                        <p className="text-xs font-black text-slate-700">{new Date(inst.dueDate).toLocaleDateString('pt-BR')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Parcela {inst.installmentIndex}/{inst.totalInstallments}</p>
                        <p className="text-md font-black text-slate-900">R$ {inst.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
                       {inst.status !== PaymentStatus.PAID ? (
                         <button 
                            onClick={() => onPayInstallment(inst.saleId, inst.id, true)}
                            className="w-full bg-emerald-600 text-white py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition"
                         >
                           Baixar Parcela
                         </button>
                       ) : (
                         <button 
                            onClick={() => onPayInstallment(inst.saleId, inst.id, false)}
                            className="text-[9px] font-black text-slate-400 uppercase hover:text-rose-500 underline tracking-tighter"
                         >
                           Estornar Recebimento
                         </button>
                       )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Agenda;
