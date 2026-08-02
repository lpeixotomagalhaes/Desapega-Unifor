"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { Reveal } from "@/components/Reveal";

const SLIDES = [
  {
    src: "/hero/feira-02.jpg",
    alt: "Feira de Profissões Unifor — campus movimentado",
    credit: "Foto: Ares Soares / Unifor",
  },
  {
    src: "/hero/feira-03.jpg",
    alt: "Feira de Profissões Unifor — vivência no campus",
    credit: "Foto: Ares Soares / Unifor",
  },
  {
    src: "/hero/feira-04.jpg",
    alt: "Feira de Profissões Unifor — estudantes no campus",
    credit: "Foto: Ares Soares / Unifor",
  },
  {
    src: "/hero/feira-01.jpg",
    alt: "Campus universitário — atmosfera de feira e encontro",
    credit: "Unifor",
  },
] as const;

const INTERVAL_MS = 5500;

export function HeroCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, INTERVAL_MS);
    return () => window.clearInterval(id);
  }, []);

  return (
    <section className="relative min-h-[22rem] overflow-hidden text-white sm:min-h-[28rem] lg:min-h-[32rem]">
      {SLIDES.map((slide, i) => (
        <div
          key={slide.src}
          className={`absolute inset-0 transition-all duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
            i === index
              ? "opacity-100 scale-100"
              : "pointer-events-none opacity-0 scale-[1.03]"
          }`}
          aria-hidden={i !== index}
        >
          <Image
            src={slide.src}
            alt={slide.alt}
            fill
            priority={i === 0}
            sizes="100vw"
            className={`object-cover object-center transition-transform duration-[6500ms] ease-out ${
              i === index ? "scale-105" : "scale-100"
            }`}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-navy/90 via-navy/65 to-navy/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-navy/55 via-transparent to-navy/25" />
        </div>
      ))}

      <div className="hero-bottom-fade" aria-hidden />

      <Reveal
        variant="slide-up"
        className="relative z-10 mx-auto flex max-w-7xl flex-col items-start gap-4 px-4 py-16 pb-24 sm:gap-5 sm:px-6 sm:py-24 sm:pb-28 lg:py-28 lg:pb-32"
      >
        <BrandLogo
          variant="horizontal"
          height={48}
          priority
        />
        <p className="max-w-2xl font-[family-name:var(--font-display)] text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
          Desapega UNIFOR
        </p>
        <p className="text-sm font-medium text-white/75 sm:text-base">
          Projeto Vortex
        </p>
        <p className="max-w-xl text-lg text-white/85 sm:text-xl">
          Economia circular no campus: doe ou venda livros, calculadoras,
          jalecos e materiais — e ajude quem está chegando na universidade.
        </p>
      </Reveal>

      <div className="absolute bottom-5 left-0 right-0 z-20 flex flex-col items-center gap-2 px-4 sm:bottom-7">
        <div className="flex gap-2" role="tablist" aria-label="Slides do hero">
          {SLIDES.map((slide, i) => (
            <button
              key={slide.src}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Slide ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-2 rounded-full transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                i === index
                  ? "w-8 bg-navy/70"
                  : "w-2 bg-navy/30 hover:bg-navy/50"
              }`}
            />
          ))}
        </div>
        <p className="text-[10px] text-navy/55 sm:text-xs">
          {SLIDES[index]?.credit}
        </p>
      </div>
    </section>
  );
}
