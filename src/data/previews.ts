export interface Preview {
  id: string;
  src: string;
  title: string;
  description: string;
  duration: number; // seconds (real video duration for display)
  author: string;
  views: string;
  tags: string[];
}

export const previews: Preview[] = [
  {
    id: "pv1",
    src: "/previews/pv1.mp4",
    title: "Momento exclusivo — Preview 1",
    description:
      "Um dos conteúdos mais acessados da plataforma. Assine para desbloquear o conteúdo completo em alta definição e sem limite de tempo.",
    duration: 40,
    author: "StreamVault Originals",
    views: "24.5K visualizações",
    tags: ["Exclusivo", "HD"],
  },
  {
    id: "pv2",
    src: "/previews/pv2.mp4",
    title: "Conteúdo premium — Preview 2",
    description:
      "Prévia limitada de um dos favoritos dos assinantes. Milhares de pessoas já desbloquearam o acesso completo — garanta o seu.",
    duration: 40,
    author: "StreamVault Originals",
    views: "31.2K visualizações",
    tags: ["Tendência", "4K"],
  },
  {
    id: "pv3",
    src: "/previews/pv3.mp4",
    title: "Acesso restrito — Preview 3",
    description:
      "Disponível apenas para assinantes. Essa preview expira em breve. Aproveite enquanto ainda tem créditos ou assine agora.",
    duration: 40,
    author: "StreamVault Originals",
    views: "18.7K visualizações",
    tags: ["Novo", "Exclusivo"],
  },
];
