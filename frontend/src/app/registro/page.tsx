import { Suspense } from "react";
import { AuthForm } from "@/components/AuthForm";

export const metadata = { title: "Criar conta — Desapega UNIFOR" };

export default function RegistroPage() {
  return (
    <Suspense>
      <AuthForm mode="registro" />
    </Suspense>
  );
}
