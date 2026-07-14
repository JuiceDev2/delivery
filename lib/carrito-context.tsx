"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export interface LineaCarrito {
  productoId: string;
  negocioId: string;
  nombre: string;
  precio: number;
  cantidad: number;
}

interface CarritoContexto {
  lineas: LineaCarrito[];
  agregar: (linea: Omit<LineaCarrito, "cantidad">) => void;
  quitar: (productoId: string) => void;
  vaciar: () => void;
  total: number;
}

const Contexto = createContext<CarritoContexto | null>(null);

export function CarritoProvider({ children }: { children: ReactNode }) {
  const [lineas, setLineas] = useState<LineaCarrito[]>([]);

  function agregar(linea: Omit<LineaCarrito, "cantidad">) {
    setLineas((actual) => {
      const existe = actual.find((l) => l.productoId === linea.productoId);
      if (existe) {
        return actual.map((l) =>
          l.productoId === linea.productoId ? { ...l, cantidad: l.cantidad + 1 } : l
        );
      }
      return [...actual, { ...linea, cantidad: 1 }];
    });
  }

  function quitar(productoId: string) {
    setLineas((actual) => actual.filter((l) => l.productoId !== productoId));
  }

  function vaciar() {
    setLineas([]);
  }

  const total = lineas.reduce((acc, l) => acc + l.precio * l.cantidad, 0);

  return (
    <Contexto.Provider value={{ lineas, agregar, quitar, vaciar, total }}>
      {children}
    </Contexto.Provider>
  );
}

export function useCarrito() {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error("useCarrito debe usarse dentro de CarritoProvider");
  return ctx;
}
