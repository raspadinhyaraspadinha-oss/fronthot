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
    title: "Celular hackeado — Preview 1",
    description:
      "Um dos conteúdos mais acessados da plataforma. 2 alunas com um aluno mais velho, o video completo tem 30 minutos e acontece de tudo. Apenas para assinantes.",
    duration: 40,
    author: "Vazados de celulares invadidos",
    views: "24.5K visualizações",
    tags: ["Exclusivo", "HD"],
  },
  {
    id: "pv2",
    src: "/previews/pv2.mp4",
    title: "Conteúdo premium — Preview 2",
    description:
      "Prévia limitada de um dos favoritos dos assinantes. Diversos videos vazados dessa menina em um resort em Maceio/AL - Aproveite enquanto ainda tem créditos ou assine agora.",
    duration: 40,
    author: "Vazados Exclusivos do iCloud",
    views: "31.2K visualizações",
    tags: ["Tendência", "4K"],
  },
  {
    id: "pv3",
    src: "/previews/pv3.mp4",
    title: "Rafaela e seu professor — Preview 3",
    description:
      "A pasta desse vazado tem 10 videos dela com o professor de matemática, o mais visto da plataforma são eles na cozinha da escola. Disponível apenas para assinantes. ",
    duration: 40,
    author: "Vazados de escolas",
    views: "18.7K visualizações",
    tags: ["Novo", "Exclusivo"],
  },
];
