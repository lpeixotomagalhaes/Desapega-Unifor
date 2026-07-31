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

export type ItemStatus = "ATIVO" | "NEGOCIANDO" | "CONCLUIDO";

export interface Item {
  id: string;
  title: string;
  description: string;
  categories: Category[];
  price: string | null;
  isDonation: boolean;
  imageUrl: string;
  status: ItemStatus;
  negotiatingWithId?: string | null;
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
  phone: string | null;
  avatarUrl: string | null;
  onboardingCompletedAt: string | null;
}

export interface AuthResponse {
  accessToken: string;
  user: SessionUser;
  isNewUser: boolean;
}

export interface CreateItemInput {
  title: string;
  description: string;
  categories: Category[];
  price?: number;
  isDonation?: boolean;
  imageUrl: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  phone: string;
}

export interface UpdateMeInput {
  name?: string;
  phone?: string;
  avatarUrl?: string;
}

export interface ItemInterest {
  id: string;
  itemId: string;
  buyerId: string;
  createdAt: string;
  item: { id: string; title: string; imageUrl: string; status: ItemStatus };
  buyer: { id: string; name: string };
}

export type NotificationType = "NEW_INTEREST" | "ITEM_STATUS_CHANGED";

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  itemId: string | null;
  readAt: string | null;
  createdAt: string;
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
  options: RequestInit & { token?: string | null; json?: boolean } = {},
): Promise<T> {
  const { token, json = true, ...init } = options;

  const headers: HeadersInit = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...init.headers,
  };
  // FormData precisa que o browser defina o boundary do multipart
  if (json) {
    (headers as Record<string, string>)["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
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

  getItem: (id: string) => request<Item>(`/items/${id}`),

  getMyItems: (token: string) => request<Item[]>("/items/mine", { token }),

  getMyInterests: (token: string) =>
    request<ItemInterest[]>("/items/mine/interests", { token }),

  getMyPurchases: (token: string) =>
    request<
      Array<{
        id: string;
        createdAt: string;
        item: Item;
      }>
    >("/items/mine/purchases", { token }),

  createItem: (token: string, data: CreateItemInput) =>
    request<Item>("/items", {
      method: "POST",
      body: JSON.stringify(data),
      token,
    }),

  uploadImage: (token: string, file: File) => {
    const body = new FormData();
    body.append("file", file);
    return request<{ url: string }>("/uploads", {
      method: "POST",
      body,
      token,
      json: false,
    });
  },

  updateItemStatus: (
    token: string,
    id: string,
    data: { status: ItemStatus; negotiatingWithId?: string | null },
  ) =>
    request<Item>(`/items/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify(data),
      token,
    }),

  expressInterest: (token: string, id: string) =>
    request<{ whatsappUrl: string }>(`/items/${id}/interest`, {
      method: "POST",
      token,
    }),

  deleteItem: (token: string, id: string) =>
    request<{ deleted: boolean }>(`/items/${id}`, { method: "DELETE", token }),

  register: (data: RegisterInput) =>
    request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  loginWithGoogle: (idToken: string) =>
    request<AuthResponse>("/auth/google", {
      method: "POST",
      body: JSON.stringify({ idToken }),
    }),

  checkEmail: (email: string) =>
    request<{ exists: boolean }>(
      `/auth/check-email?email=${encodeURIComponent(email)}`,
    ),

  getMe: (token: string) => request<SessionUser>("/auth/me", { token }),

  updateMe: (token: string, data: UpdateMeInput) =>
    request<SessionUser>("/auth/me", {
      method: "PATCH",
      body: JSON.stringify(data),
      token,
    }),

  completeOnboarding: (token: string) =>
    request<SessionUser>("/auth/me/onboarding", { method: "PATCH", token }),

  getNotifications: (token: string) =>
    request<AppNotification[]>("/notifications", { token }),

  getUnreadNotificationsCount: (token: string) =>
    request<{ count: number }>("/notifications/unread-count", { token }),

  markNotificationRead: (token: string, id: string) =>
    request<AppNotification>(`/notifications/${id}/read`, {
      method: "PATCH",
      token,
    }),

  markAllNotificationsRead: (token: string) =>
    request<{ updated: boolean }>("/notifications/read-all", {
      method: "PATCH",
      token,
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

export function formatCategories(categories: Category[]): string {
  return categories.map((c) => CATEGORIES[c]).join(" · ");
}

export function itemStatusLabel(item: Item): string | null {
  if (item.status === "NEGOCIANDO") return "Em negociação";
  if (item.status === "CONCLUIDO") return item.isDonation ? "Doado" : "Vendido";
  return null;
}

/** Resolve caminhos relativos de upload (`/uploads/...`) para URL absoluta da API. */
export function resolveImageUrl(imageUrl: string): string {
  if (
    imageUrl.startsWith("http://") ||
    imageUrl.startsWith("https://") ||
    imageUrl.startsWith("blob:") ||
    imageUrl.startsWith("data:")
  ) {
    return imageUrl;
  }
  if (imageUrl.startsWith("/")) {
    return `${API_URL}${imageUrl}`;
  }
  return imageUrl;
}
