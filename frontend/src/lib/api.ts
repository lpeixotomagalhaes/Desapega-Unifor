export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export const CATEGORIES = {
  LIVROS: "Livros",
  ELETRONICOS: "Eletrônicos",
  ENGENHARIA: "Engenharia",
  COMPUTACAO: "Computação",
  VESTUARIO: "Vestuário",
  MOVEIS: "Móveis",
  OUTROS: "Outros",
} as const;

export type Category = keyof typeof CATEGORIES;

export interface Item {
  id: string;
  title: string;
  description: string;
  category: Category;
  price: string | null;
  isDonation: boolean;
  imageUrl: string;
  status: "ATIVO" | "VENDIDO";
  createdAt: string;
  user: { id: string; name: string };
}

export interface Stats {
  activeItems: number;
  donations: number;
  soldItems: number;
  users: number;
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
}

export interface AuthResponse {
  accessToken: string;
  user: SessionUser;
}

export interface CreateItemInput {
  title: string;
  description: string;
  category: Category;
  price?: number;
  isDonation?: boolean;
  imageUrl: string;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {},
): Promise<T> {
  const { token, ...init } = options;

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  const body = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    const message =
      body && typeof body === "object" && "message" in body
        ? Array.isArray((body as { message: unknown }).message)
          ? ((body as { message: string[] }).message[0] ?? "Erro na requisição.")
          : String((body as { message: unknown }).message)
        : "Erro na requisição.";
    throw new ApiError(response.status, message);
  }

  return body as T;
}

export const api = {
  getStats: () => request<Stats>("/stats"),

  getItems: (params?: { category?: Category; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.category) query.set("category", params.category);
    if (params?.search) query.set("search", params.search);
    const qs = query.toString();
    return request<Item[]>(`/items${qs ? `?${qs}` : ""}`);
  },

  getMyItems: (token: string) => request<Item[]>("/items/mine", { token }),

  createItem: (token: string, data: CreateItemInput) =>
    request<Item>("/items", {
      method: "POST",
      body: JSON.stringify(data),
      token,
    }),

  deleteItem: (token: string, id: string) =>
    request<{ deleted: boolean }>(`/items/${id}`, { method: "DELETE", token }),

  register: (data: { name: string; email: string; password: string }) =>
    request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

export function formatPrice(item: Item): string {
  if (item.isDonation) return "Doação";
  if (item.price == null) return "A combinar";
  return Number(item.price).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}
