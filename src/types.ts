export type ServiceStatus = 'Recebido' | 'Em análise' | 'Aguardando peça' | 'Em reparo' | 'Finalizado' | 'Entregue';
export type Client = { id: string; name: string; document: string; phone: string; email: string; city: string };
export type Equipment = { id: string; clientId: string; category: 'Eletrônico' | 'Energia solar' | 'Elétrico'; brand: string; model: string; serial: string; notes: string };
export type ServiceOrder = { id: string; clientId: string; equipmentId: string; status: ServiceStatus; intakeDate: string; exitDate?: string; problem: string; diagnosis: string; history: Array<{ at: string; status: ServiceStatus; note: string }>; documents?: Array<{ name: string; url: string }> };
export type Quote = { id: string; serviceOrderId: string; parts: number; labor: number; discount: number; approved: boolean };
export type FinanceEntry = { id: string; type: 'Receber' | 'Pagar'; description: string; amount: number; dueDate: string; paid: boolean };
