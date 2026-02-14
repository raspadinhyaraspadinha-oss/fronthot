export interface Plan {
  id: string;
  name: string;
  price: number;
  priceDisplay: string;
  period: string;
  features: string[];
  slotsTotal: number;
  slotsFilled: number;
  badge?: string;
  popular?: boolean;
}

export const plans: Plan[] = [
  {
    id: "prata",
    name: "Prata",
    price: 990,
    priceDisplay: "R$ 9,90",
    period: "7 dias",
    features: [
      "Acesso a previews completos",
      "Qualidade padrão (720p)",
      "Suporte por e-mail",
    ],
    slotsTotal: 100,
    slotsFilled: 93,
  },
  {
    id: "ouro",
    name: "Ouro",
    price: 1990,
    priceDisplay: "R$ 19,90",
    period: "15 dias",
    features: [
      "Acesso completo ao catálogo",
      "Qualidade alta (1080p)",
      "Suporte prioritário",
    ],
    slotsTotal: 100,
    slotsFilled: 96,
    badge: "Quase esgotado",
    popular: true,
  },
  {
    id: "black",
    name: "Black",
    price: 4990,
    priceDisplay: "R$ 49,90",
    period: "30 dias",
    features: [
      "Acesso ilimitado completo(+ de 140.000 videos vazados)",
      "Qualidade máxima (4K) + Download Habilitado",
      "Conteúdos de classe especial: os vazados mais proibidos e raros.",
    ],
    slotsTotal: 50,
    slotsFilled: 48,
    badge: "Quase esgotado",
  },
];
