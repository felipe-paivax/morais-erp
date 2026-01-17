
export enum OrderStatus {
  PENDING_QUOTES = 'Aguardando Cotações',
  READY_FOR_APPROVAL = 'Pronto para Aprovação',
  APPROVED = 'Aprovado',
  REJECTED = 'Rejeitado',
  DELIVERED = 'Entregue'
}

export type PaymentMethod = 'PIX' | 'Boleto' | 'Cartão Crédito' | 'Cartão Débito';

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  document: string;
}

export interface Supplier {
  id: string;
  name: string;
  category: string;
  email: string;
  phone: string;
  document: string;
  contactPerson?: string;
  website?: string;
  rating: number;
}

export interface Material {
  id: string;
  name: string;
  category: string;
  unit: string;
  description?: string;
  minStock?: number;
}

export interface Project {
  id: string;
  name: string;
  clientId: string;
  budget: number;
  startDate: string;
  status: 'In Progress' | 'Completed' | 'Planning';
}

export interface MaterialItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category?: string;
}

export interface ItemQuoteEntry {
  itemId: string;
  unitPrice: number;
}

export interface OrderQuote {
  id: string;
  supplierId: string;
  totalPrice: number;
  deliveryDays: number;
  isSelected: boolean;
  justification?: string;
  paymentMethod?: PaymentMethod;
  observations?: string;
  isFreightIncluded: boolean;
  freightCost?: number;
  billingTerms?: string;
  itemPrices: ItemQuoteEntry[];
}

export interface MaterialOrder {
  id: string;
  projectId: string;
  requestDate: string;
  status: OrderStatus;
  requestedBy: string;
  items: MaterialItem[];
  orderQuotes: OrderQuote[];
}

// Tipos Financeiros
export enum PaymentStatus {
  PENDING = 'Pendente',
  PAID = 'Pago',
  OVERDUE = 'Vencido',
  CANCELLED = 'Cancelado'
}

export type TransactionCategory = 'Materiais' | 'Serviços' | 'Administrativo' | 'Mão de Obra' | 'Equipamentos' | 'Outros';

export interface AccountPayable {
  id: string;
  orderId?: string; // Vinculado a um pedido aprovado (opcional)
  projectId: string;
  supplierId: string;
  description: string;
  amount: number;
  dueDate: string;
  paymentDate?: string;
  status: PaymentStatus;
  paymentMethod?: PaymentMethod;
  category: TransactionCategory;
  billingTerms?: string;
  observations?: string;
  createdAt: string;
  createdBy: string;
}

export interface AccountReceivable {
  id: string;
  projectId: string;
  clientId: string;
  description: string;
  amount: number;
  dueDate: string;
  paymentDate?: string;
  status: PaymentStatus;
  paymentMethod?: PaymentMethod;
  installmentNumber?: number; // Para parcelas
  totalInstallments?: number;
  observations?: string;
  createdAt: string;
  createdBy: string;
}

export interface CashFlowEntry {
  id: string;
  date: string;
  type: 'income' | 'expense';
  category: TransactionCategory;
  description: string;
  amount: number;
  accountPayableId?: string;
  accountReceivableId?: string;
  projectId?: string;
}
