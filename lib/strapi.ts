const STRAPI_HOST = process.env.NEXT_PUBLIC_STRAPI_HOST;
const TOKEN = "token";

export const getStrapiToken = () => localStorage.getItem(TOKEN);
export const setStrapiToken = (token: string) =>
  localStorage.setItem(TOKEN, token);
export const removeStrapiToken = () => localStorage.removeItem(TOKEN);

async function query(
  url: string,
  method: string = "GET",
  body?: unknown,
  dataBody: boolean = true,
) {
  const token = getStrapiToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const options: RequestInit = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(dataBody ? { data: body } : body);
  }

  try {
    const response: Response = await fetch(
      `${STRAPI_HOST}/api/${url}`,
      options,
    );

    if (!response.ok) {
      const errorDetails = await response.json().catch(() => ({
        message: `HTTP error! status: ${response.status}`,
      }));
      return {
        data: [],
        error: {
          details: {
            message:
              errorDetails.error?.message ||
              `HTTP error! status: ${response.status}`,
            name: errorDetails.error?.name || "RequestError",
            status: response.status,
          },
        },
      };
    }

    // Verificar que el contenido sea JSON y que no esté vacío
    const contentType = response.headers.get("Content-Type") || "";
    if (contentType.includes("application/json")) {
      return response.json();
    }

    // Devolver un objeto vacío si no hay JSON en la respuesta
    return { data: [] };
  } catch (error) {
    return {
      data: [],
      error: {
        details: {
          message: (error as Error).message,
          name: "FetchError",
          status: 500,
        },
      },
    };
  }
}

export interface ResponseStrapi<T> {
  data: T[];
  error?: {
    details: {
      message: string;
      name: string;
      status: number;
    };
  };
}

export interface PageableResponseStrapi<T> {
  data: T[];
  meta: {
    pagination: {
      page: number;
      pageCount: number;
      pageSize: number;
      total: number;
    };
  };
  error?: {
    details: {
      message: string;
      name: string;
      status: number;
    };
  };
}

export interface AuthResponseStrapi {
  jwt: string;
  user: UserData;
  error?: {
    details: {
      message: string;
      name: string;
      status: number;
    };
  };
}

// AUTH
export async function login(
  identifier: string,
  password: string,
): Promise<AuthResponseStrapi> {
  return query("auth/local", "POST", { identifier, password }, false);
}

// USER
export interface UserData {
  id: number;
  documentId: string;
  email: string;
  password: string;
  role: string;
  createdAt: number;
  updatedAt: number;
}

// QUICK NOTE
export interface QuickNoteData {
  id: number;
  documentId: string;
  name: string;
}

export async function getQuickNotes(): Promise<
  PageableResponseStrapi<QuickNoteData>
> {
  return query("quick-notes").then(
    (res: PageableResponseStrapi<QuickNoteData>) => res,
  );
}

export async function createQuickNote(
  quickNoteData: Omit<QuickNoteData, "id" | "documentId">,
): Promise<ResponseStrapi<QuickNoteData>> {
  return query("quick-notes", "POST", quickNoteData);
}

export async function updateQuickNote(
  documentId: string,
  quickNoteData: Partial<QuickNoteData>,
): Promise<ResponseStrapi<QuickNoteData>> {
  return query(`quick-notes/${documentId}`, "PUT", quickNoteData);
}

export async function deleteQuickNote(
  documentId: string,
): Promise<ResponseStrapi<QuickNoteData>> {
  return query(`quick-notes/${documentId}`, "DELETE");
}

// EXTRA
export interface ExtraData {
  id: number;
  documentId: string;
  name: string;
  price: number;
}

export async function getExtras(): Promise<PageableResponseStrapi<ExtraData>> {
  return query("extras").then((res: PageableResponseStrapi<ExtraData>) => res);
}

export async function createExtra(
  extraData: Omit<ExtraData, "id" | "documentId">,
): Promise<ResponseStrapi<ExtraData>> {
  return query("extras", "POST", extraData);
}

export async function updateExtra(
  documentId: string,
  extraData: Partial<ExtraData>,
): Promise<ResponseStrapi<ExtraData>> {
  return query(`extras/${documentId}`, "PUT", extraData);
}

export async function deleteExtra(
  documentId: string,
): Promise<ResponseStrapi<ExtraData>> {
  return query(`extras/${documentId}`, "DELETE");
}

// CATEGORY

export interface CategoryData {
  id: number;
  documentId: string;
  name: string;
  products: ProductData[];
}

export async function getCategories(): Promise<
  PageableResponseStrapi<CategoryData>
> {
  return query("categories").then(
    (res: PageableResponseStrapi<CategoryData>) => res,
  );
}

export async function createCategory(
  categoryData: Omit<CategoryData, "id" | "documentId">,
): Promise<ResponseStrapi<CategoryData>> {
  return query("categories", "POST", categoryData);
}

export async function updateCategory(
  documentId: string,
  categoryData: Partial<CategoryData>,
): Promise<ResponseStrapi<CategoryData>> {
  return query(`categories/${documentId}`, "PUT", categoryData);
}

export async function deleteCategory(
  documentId: string,
): Promise<ResponseStrapi<CategoryData>> {
  return query(`categories/${documentId}`, "DELETE");
}

// SUBCATEGORY

export interface SubcategoryData {
  id: number;
  documentId: string;
  name: string;
  products: ProductData[];
}

export async function getSubcategories(): Promise<
  PageableResponseStrapi<SubcategoryData>
> {
  return query("subcategories").then(
    (res: PageableResponseStrapi<SubcategoryData>) => res,
  );
}

export async function createSubcategory(
  subcategoryData: Omit<SubcategoryData, "id" | "documentId">,
): Promise<ResponseStrapi<SubcategoryData>> {
  return query("subcategories", "POST", subcategoryData);
}

export async function updateSubcategory(
  documentId: string,
  subcategoryData: Partial<SubcategoryData>,
): Promise<ResponseStrapi<SubcategoryData>> {
  return query(`subcategories/${documentId}`, "PUT", subcategoryData);
}

export async function deleteSubcategory(
  documentId: string,
): Promise<ResponseStrapi<SubcategoryData>> {
  return query(`subcategories/${documentId}`, "DELETE");
}

// PRODUCT

export interface ProductData {
  id: number;
  documentId: string;
  name: string;
  price: number;
  alwaysPrepared: boolean;
  category: CategoryData;
  subcategory: SubcategoryData;
  quick_notes: QuickNoteData[];
  extras: ExtraData[];
}

export async function getProducts(): Promise<
  PageableResponseStrapi<ProductData>
> {
  return query(
    "products" +
      "?populate[0]=category" +
      "&populate[1]=subcategory" +
      "&populate[2]=quick_notes" +
      "&populate[3]=extras",
  ).then((res: PageableResponseStrapi<ProductData>) => res);
}

export async function createProduct(
  productData: Omit<ProductData, "id" | "documentId">,
): Promise<ResponseStrapi<ProductData>> {
  return query("products", "POST", productData);
}

export async function updateProduct(
  documentId: string,
  productData: Partial<ProductData>,
): Promise<ResponseStrapi<ProductData>> {
  return query(`products/${documentId}`, "PUT", productData);
}

export async function deleteProduct(
  documentId: string,
): Promise<ResponseStrapi<ProductData>> {
  return query(`products/${documentId}`, "DELETE");
}

// ORDER

export interface OrderData {
  id: number;
  documentId: string;
  quantity: number;
  prepared: boolean;
  served: boolean;
  paid: boolean;
  product: ProductData;
  extras: ExtraData[];
  notes: string;
  createdAt: number;
  updatedAt: number;
  releasedAt: number;
  tableId: number;
  tableNumber: number;
}

interface OrderStrapiData extends Omit<OrderData, "tableId" | "tableNumber"> {
  table: TableData;
}

export async function createOrder(
  orderData: Omit<
    OrderData,
    | "id"
    | "documentId"
    | "tableId"
    | "tableNumber"
    | "product"
    | "createdAt"
    | "updatedAt"
    | "releasedAt"
  > & {
    table: number;
    product: number;
  },
): Promise<ResponseStrapi<OrderData>> {
  return query("orders", "POST", orderData);
}

export async function updateOrder(
  documentId: string,
  orderData: Partial<Omit<OrderData, "extras"> & { extras: number[] }>,
): Promise<ResponseStrapi<OrderData>> {
  return query(`orders/${documentId}`, "PUT", orderData);
}

export async function deleteOrder(
  documentId: string,
): Promise<ResponseStrapi<OrderData>> {
  return query(`orders/${documentId}`, "DELETE");
}

// TABLE

export interface TableData {
  id: number;
  documentId: string;
  number: number;
  orders: OrderData[];
}

interface TableStrapiData extends Omit<TableData, "orders"> {
  orders: OrderStrapiData[];
}

export async function getTables(): Promise<PageableResponseStrapi<TableData>> {
  return query(
    "tables" +
      "?populate[orders][populate][extras]=true" +
      "&populate[orders][populate][product][populate][extras]=true" +
      "&populate[orders][populate][product][populate][quick_notes]=true",
  ).then((res: PageableResponseStrapi<TableStrapiData>) => {
    return {
      ...res,
      data: res.data
        .map((table) => ({
          ...table,
          orders:
            table.orders
              ?.map((order) => ({
                ...order,
                tableId: table.id,
                tableNumber: table.number,
              }))
              .sort(
                (a, b) =>
                  new Date(a.createdAt).getTime() -
                  new Date(b.createdAt).getTime(),
              ) || [],
        }))
        .sort((a, b) => a.number - b.number),
    };
  });
}

export async function createTable(
  tableData: Omit<TableData, "id" | "documentId">,
): Promise<ResponseStrapi<TableData>> {
  return query("tables", "POST", tableData);
}

export async function deleteTable(
  documentId: string,
): Promise<ResponseStrapi<TableData>> {
  return query(`tables/${documentId}`, "DELETE");
}
