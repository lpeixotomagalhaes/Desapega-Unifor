import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcryptjs';
import { PrismaClient } from '../src/generated/prisma/client';
import { Category } from '../src/generated/prisma/enums';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const passwordHash = await bcrypt.hash('123456', 10);

  const demo = await prisma.user.upsert({
    where: { email: 'demo@edu.unifor.br' },
    update: {},
    create: {
      name: 'Estudante Demo',
      email: 'demo@edu.unifor.br',
      passwordHash,
      phone: '5585912345678',
    },
  });

  // Usuário sem telefone: exercita o fluxo de /completar-perfil (ex.: quem entra com Google).
  await prisma.user.upsert({
    where: { email: 'incompleto@edu.unifor.br' },
    update: {},
    create: {
      name: 'Perfil Incompleto',
      email: 'incompleto@edu.unifor.br',
      passwordHash: await bcrypt.hash('123456', 10),
    },
  });

  const items: Array<{
    title: string;
    description: string;
    categories: Category[];
    price: number | null;
    isDonation: boolean;
    imageUrl: string;
  }> = [
    {
      title: 'Cálculo Vol. 1 — James Stewart',
      description:
        'Livro de Cálculo 1 em ótimo estado, poucas marcações a lápis. Ideal para quem está começando Engenharia ou Computação.',
      categories: [Category.LIVROS, Category.ENGENHARIA, Category.COMPUTACAO],
      price: 60,
      isDonation: false,
      imageUrl: 'https://picsum.photos/seed/calculo/600/400',
    },
    {
      title: 'Calculadora Científica Casio FX-82MS',
      description:
        'Calculadora funcionando perfeitamente, acompanha capa. Usei durante 2 semestres de Física.',
      categories: [Category.ELETRONICOS, Category.ENGENHARIA],
      price: 45,
      isDonation: false,
      imageUrl: 'https://picsum.photos/seed/casio/600/400',
    },
    {
      title: 'Jaleco branco tamanho M',
      description:
        'Jaleco de laboratório tamanho M, usado apenas um semestre. Doando para quem vai começar as aulas práticas.',
      categories: [Category.VESTUARIO],
      price: null,
      isDonation: true,
      imageUrl: 'https://picsum.photos/seed/jaleco/600/400',
    },
    {
      title: 'Kit Arduino Uno + protoboard e jumpers',
      description:
        'Kit completo para projetos de eletrônica: Arduino Uno original, protoboard 830 pontos, jumpers e LEDs.',
      categories: [Category.ENGENHARIA, Category.ELETRONICOS, Category.COMPUTACAO],
      price: 120,
      isDonation: false,
      imageUrl: 'https://picsum.photos/seed/arduino/600/400',
    },
    {
      title: 'Apostilas de Algoritmos e Estruturas de Dados',
      description:
        'Material impresso completo das disciplinas de Algoritmos 1 e 2, com anotações e exercícios resolvidos. Doação!',
      categories: [Category.COMPUTACAO, Category.LIVROS],
      price: null,
      isDonation: true,
      imageUrl: 'https://picsum.photos/seed/apostila/600/400',
    },
    {
      title: 'Escrivaninha de estudos com cadeira',
      description:
        'Escrivaninha 1,20m com cadeira giratória. Retirada no bairro Edson Queiroz, perto do campus.',
      categories: [Category.MOVEIS],
      price: 150,
      isDonation: false,
      imageUrl: 'https://picsum.photos/seed/mesa/600/400',
    },
  ];

  for (const item of items) {
    const exists = await prisma.item.findFirst({
      where: { title: item.title, userId: demo.id },
    });
    if (!exists) {
      await prisma.item.create({ data: { ...item, userId: demo.id } });
    }
  }

  console.log('Seed concluído: usuário demo@edu.unifor.br (senha 123456) e itens de exemplo.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
