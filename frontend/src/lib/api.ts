export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002";

/** Categorias de anúncio por área do desapego (não confundir com cursos). */
export const CATEGORIES = {
  LIVROS: "Livros e apostilas",
  ELETRONICOS: "Eletrônicos",
  ENGENHARIA: "Material de engenharia",
  COMPUTACAO: "Material de computação",
  VESTUARIO: "Vestuário",
  MOVEIS: "Móveis",
  OUTROS: "Outros",
} as const;

export type Category = keyof typeof CATEGORIES;

export type ItemStatus = "ATIVO" | "NEGOCIANDO" | "CONCLUIDO" | "SUSPENSO";

export interface Item {
  id: string;
  title: string;
  description: string;
  categories?: Category[];
  price: string | null;
  isDonation: boolean;
  imageUrl: string;
  imageUrls?: string[];
  status: ItemStatus;
  negotiatingWithId?: string | null;
  createdAt: string;
  user: { id: string; name: string };
}

export interface ItemComment {
  id: string;
  itemId: string;
  body: string;
  createdAt: string;
  user: { id: string; name: string; avatarUrl: string | null };
}

export interface Stats {
  activeItems: number;
  donations: number;
  soldItems: number;
  users: number;
}

export type UserRole = "USER" | "ADMIN" | "SUPER_ADMIN";

export type SupportTicketStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "CLOSED";

export type AccountStatus = "ACTIVE" | "SUSPENDED" | "BANNED";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  bio?: string | null;
  course?: string | null;
  enrollment?: string | null;
  role?: UserRole;
  accountStatus?: AccountStatus;
  suspendedUntil?: string | null;
  moderationReason?: string | null;
  onboardingCompletedAt: string | null;
}
export type ModerateUserAction = "BAN" | "SUSPEND" | "RESTORE";

export interface AdminTrendPoint {
  date: string;
  sales: number;
  donations: number;
  newUsers: number;
  newItems: number;
}

export interface AdminStats {
  users: number;
  activeItems: number;
  donations: number;
  negotiating: number;
  concluded: number;
  openTickets: number;
  bannedUsers?: number;
  suspendedUsers?: number;
  salesTotal?: number;
  donationsConcluded?: number;
  ordersByStatus?: {
    PENDENTE: number;
    NEGOCIANDO: number;
    ENTREGUE: number;
  };
  trends?: AdminTrendPoint[];
  byCategory: Array<{ category: Category; count: number }>;
}

export interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string | null;
  course?: string | null;
  enrollment?: string | null;
  accountStatus: AccountStatus;
  suspendedUntil: string | null;
  moderationReason: string | null;
  moderatedAt: string | null;
  createdAt: string;
  _count?: { items: number; supportTickets: number };
}

export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  message: string;
  status: SupportTicketStatus;
  adminReply: string | null;
  assignedAdminId: string | null;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; name: string; email: string };
  assignedAdmin?: { id: string; name: string; email: string } | null;
}

export function isAdmin(user: SessionUser | null | undefined): boolean {
  return user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
}

export function isSuperAdmin(user: SessionUser | null | undefined): boolean {
  return user?.role === "SUPER_ADMIN";
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
  imageUrls?: string[];
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  phone: string;
  course: string;
  enrollment: string;
}

export interface UpdateMeInput {
  name?: string;
  phone?: string;
  avatarUrl?: string;
  bio?: string;
  course?: string | null;
  enrollment?: string | null;
}

export interface AuditLogEntry {
  id: string;
  actorId: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  summary: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  actor?: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  } | null;
}

export type NotificationType =
  | "WELCOME"
  | "ITEM_PUBLISHED"
  | "NEW_INTEREST"
  | "PROPOSAL_ACCEPTED"
  | "ITEM_STATUS_CHANGED"
  | "ITEM_SAVED_UPDATE"
  | "ORDER_DELIVERED"
  | "REVIEW_REQUEST"
  | "NEW_REVIEW"
  | "SUPPORT_REPLY"
  | "ACCOUNT_MODERATION";

export interface PendingReviewOrder {
  id: string;
  itemId: string;
  status: OrderStatus;
  updatedAt?: string;
  item: {
    id: string;
    title: string;
    imageUrl: string;
    user: { id: string; name: string; avatarUrl: string | null };
  };
}

export interface ProfileCompletedDeal {
  id: string;
  updatedAt: string;
  item: {
    id: string;
    title: string;
    imageUrl: string;
    isDonation: boolean;
    price: string | null;
    status: ItemStatus;
  };
  buyer: { id: string; name: string };
  review: {
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
  } | null;
}

export interface PublicProfile {
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    avatarUrl: string | null;
    bio: string | null;
    course: string | null;
    enrollment: string | null;
    createdAt: string;
  };
  online: boolean;
  lastSeenAt: string | null;
  ratingAvg: number | null;
  ratingCount: number;
  reviews: Array<{
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    rater: { id: string; name: string; avatarUrl: string | null };
    order: { item: { id: string; title: string } };
  }>;
  activeItems: Item[];
  completedDeals: ProfileCompletedDeal[];
}

export type OrderStatus = "PENDENTE" | "NEGOCIANDO" | "ENTREGUE";

export interface ItemInterest {
  id: string;
  itemId: string;
  buyerId: string;
  course: string;
  enrollment: string;
  acceptListedPrice: boolean;
  offeredPrice: string | null;
  meetupDay: string;
  meetupTime: string;
  campusBlock: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt?: string;
  item: {
    id: string;
    title: string;
    imageUrl: string;
    status: ItemStatus;
    price?: string | null;
    isDonation?: boolean;
  };
  buyer: {
    id: string;
    name: string;
    phone?: string | null;
    avatarUrl?: string | null;
  };
}

export interface CreateOrderInput {
  course: string;
  enrollment: string;
  acceptListedPrice: boolean;
  offeredPrice?: number;
  meetupDay: string;
  meetupTime: string;
  campusBlock: string;
  customBlock?: string;
}

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

  getItemComments: (id: string) =>
    request<ItemComment[]>(`/items/${id}/comments`),

  createItemComment: (token: string, id: string, body: string) =>
    request<ItemComment>(`/items/${id}/comments`, {
      method: "POST",
      body: JSON.stringify({ body }),
      token,
    }),

  getMyItems: (token: string) => request<Item[]>("/items/mine", { token }),

  getMyInterests: (token: string) =>
    request<ItemInterest[]>("/items/mine/interests", { token }),

  getMyPurchases: (token: string) =>
    request<
      Array<{
        id: string;
        createdAt: string;
        status: OrderStatus;
        course: string;
        enrollment: string;
        meetupDay: string;
        meetupTime: string;
        campusBlock: string;
        acceptListedPrice: boolean;
        offeredPrice: string | null;
        item: Item;
        review: { id: string; rating: number } | null;
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

  createOrder: (token: string, id: string, data: CreateOrderInput) =>
    request<{ order: ItemInterest; whatsappUrl: string }>(
      `/items/${id}/orders`,
      {
        method: "POST",
        body: JSON.stringify(data),
        token,
      },
    ),

  updateOrderStatus: (token: string, orderId: string, status: OrderStatus) =>
    request<ItemInterest>(`/items/orders/${orderId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
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

  getPendingReviews: (token: string) =>
    request<PendingReviewOrder[]>("/reviews/pending", { token }),

  createReview: (
    token: string,
    data: { orderId: string; rating: number; comment?: string },
  ) =>
    request<{ id: string }>("/reviews", {
      method: "POST",
      body: JSON.stringify(data),
      token,
    }),

  getUserProfile: (id: string) =>
    request<PublicProfile>(`/users/${id}/profile`),

  getSavedItemIds: (token: string) =>
    request<{ ids: string[] }>("/saved-items/ids", { token }),

  getSavedItems: (token: string) =>
    request<Array<{ id: string; itemId: string; createdAt: string; item: Item }>>(
      "/saved-items",
      { token },
    ),

  saveItem: (token: string, itemId: string) =>
    request<{ saved: boolean; itemId: string }>(`/saved-items/${itemId}`, {
      method: "POST",
      token,
    }),

  unsaveItem: (token: string, itemId: string) =>
    request<{ saved: boolean; itemId: string }>(`/saved-items/${itemId}`, {
      method: "DELETE",
      token,
    }),

  createSupportTicket: (
    token: string,
    data: { subject: string; message: string },
  ) =>
    request<SupportTicket>("/support/tickets", {
      method: "POST",
      body: JSON.stringify(data),
      token,
    }),

  getMySupportTickets: (token: string) =>
    request<SupportTicket[]>("/support/tickets/mine", { token }),

  getAdminStats: (token: string) =>
    request<AdminStats>("/admin/stats", { token }),

  getAdminUsers: (
    token: string,
    params?: {
      page?: number;
      limit?: number;
      role?: UserRole;
      email?: string;
      accountStatus?: AccountStatus;
    },
  ) => {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.role) query.set("role", params.role);
    if (params?.email) query.set("email", params.email);
    if (params?.accountStatus) query.set("accountStatus", params.accountStatus);
    const qs = query.toString();
    return request<{
      total: number;
      page: number;
      limit: number;
      users: AdminUserRow[];
    }>(`/admin/users${qs ? `?${qs}` : ""}`, { token });
  },

  moderateUser: (
    token: string,
    userId: string,
    data: {
      action: ModerateUserAction;
      reason?: string;
      days?: number;
      takeDownItems?: boolean;
    },
  ) =>
    request<AdminUserRow>(`/admin/users/${userId}/moderate`, {
      method: "PATCH",
      body: JSON.stringify(data),
      token,
    }),

  getAdminItems: (
    token: string,
    params?: {
      page?: number;
      limit?: number;
      status?: ItemStatus;
      search?: string;
    },
  ) => {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.status) query.set("status", params.status);
    if (params?.search) query.set("search", params.search);
    const qs = query.toString();
    return request<{
      total: number;
      page: number;
      limit: number;
      items: Array<
        Item & {
          user: {
            id: string;
            name: string;
            email: string;
            accountStatus?: AccountStatus;
          };
        }
      >;
    }>(`/admin/items${qs ? `?${qs}` : ""}`, { token });
  },

  takeDownItem: (
    token: string,
    itemId: string,
    data?: { reason?: string },
  ) =>
    request<Item>(`/admin/items/${itemId}/take-down`, {
      method: "PATCH",
      body: JSON.stringify(data ?? {}),
      token,
    }),

  restoreAdminItem: (token: string, itemId: string) =>
    request<Item>(`/admin/items/${itemId}/restore`, {
      method: "PATCH",
      token,
    }),

  adminDeleteItem: (
    token: string,
    itemId: string,
    data?: { reason?: string },
  ) =>
    request<{ deleted: boolean; id: string; title: string }>(
      `/admin/items/${itemId}`,
      {
        method: "DELETE",
        body: JSON.stringify(data ?? {}),
        token,
      },
    ),

  getAdminAdmins: (token: string) =>
    request<
      Array<{
        id: string;
        name: string;
        email: string;
        role: UserRole;
        createdAt: string;
      }>
    >("/admin/admins", { token }),

  promoteAdmin: (token: string, email: string) =>
    request<{
      id: string;
      name: string;
      email: string;
      role: UserRole;
      createdAt: string;
    }>("/admin/admins", {
      method: "POST",
      body: JSON.stringify({ email }),
      token,
    }),

  revokeAdmin: (token: string, id: string) =>
    request<{
      id: string;
      name: string;
      email: string;
      role: UserRole;
      createdAt: string;
    }>(`/admin/admins/${id}/revoke`, { method: "PATCH", token }),

  getAdminSupportTickets: (token: string, status?: SupportTicketStatus) => {
    const qs = status ? `?status=${status}` : "";
    return request<SupportTicket[]>(`/admin/support${qs}`, { token });
  },

  updateAdminSupportTicket: (
    token: string,
    id: string,
    data: { status?: SupportTicketStatus; adminReply?: string },
  ) =>
    request<SupportTicket>(`/admin/support/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
      token,
    }),

  getAdminAuditLogs: (
    token: string,
    params?: { page?: number; limit?: number; action?: string },
  ) => {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.action) query.set("action", params.action);
    const qs = query.toString();
    return request<{
      total: number;
      page: number;
      limit: number;
      entries: AuditLogEntry[];
    }>(`/admin/audit${qs ? `?${qs}` : ""}`, { token });
  },
};

export function formatPrice(item: Item): string {
  if (item.isDonation) return "Doação";
  if (item.price == null) return "A combinar";
  return Number(item.price).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatCategories(categories?: Category[] | null): string {
  if (!categories?.length) return "Sem categoria";
  return categories.map((c) => CATEGORIES[c] ?? c).join(" · ");
}

export function itemStatusLabel(item: Item): string | null {
  if (item.status === "NEGOCIANDO") return "Em negociação";
  if (item.status === "SUSPENSO") return "Suspenso";
  if (item.status === "CONCLUIDO") return item.isDonation ? "Doado" : "Vendido";
  return null;
}

/** Conta banida/suspensa: pode navegar, sem anunciar/negociar. */
export function isMarketplaceRestricted(
  user: SessionUser | null | undefined,
): boolean {
  if (!user?.accountStatus) return false;
  if (user.accountStatus === "BANNED") return true;
  if (user.accountStatus === "SUSPENDED") {
    if (!user.suspendedUntil) return true;
    return new Date(user.suspendedUntil).getTime() > Date.now();
  }
  return false;
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

/** Capa + galeria (fallback para imageUrl único). */
export function itemGalleryUrls(item: Pick<Item, "imageUrl" | "imageUrls">): string[] {
  if (item.imageUrls && item.imageUrls.length > 0) {
    return item.imageUrls;
  }
  return item.imageUrl ? [item.imageUrl] : [];
}
