"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/components/ui/use-toast";
import { ChefHat, HandPlatter, Home } from "lucide-react";

import Config from "@/components/Config";
import ConfirmationModal from "@/components/ConfirmationModal";
import Kitchen from "@/components/Kitchen";
import Login from "@/components/Login";
import ReleasedOrders from "@/components/ReleasedOrders";
import Service from "@/components/Service";
import TableDetail from "@/components/TableDetail";
import TableOverview from "@/components/TableOverview";
import {
  CategoryData,
  createOrder,
  createTable,
  deleteOrder,
  deleteTable,
  ExtraData,
  getCategories,
  getExtras,
  getProducts,
  getQuickNotes,
  getStrapiToken,
  getSubcategories,
  getTables,
  login,
  OrderData,
  ProductData,
  QuickNoteData,
  removeStrapiToken,
  setStrapiToken,
  SubcategoryData,
  TableData,
  updateOrder,
} from "@/lib/strapi";
import {
  calculateTotalByOrders,
  calculateUnpaidTotalByOrders,
  getStatusColorByOrders,
} from "@/lib/utils";
import ScrollToTopButton from "@/components/ScrollToTopButton";

interface AppConfig {
  disableNotifications: boolean;
  notificationDuration: number;
  theme: "light" | "dark";
}

const initialConfig: AppConfig = {
  disableNotifications: true,
  notificationDuration: 2000,
  theme: "light",
};

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [tables, setTables] = useState<TableData[]>([]);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [extras, setExtras] = useState<ExtraData[]>([]);
  const [quickNotes, setQuickNotes] = useState<QuickNoteData[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [subcategories, setSubcategories] = useState<SubcategoryData[]>([]);
  const [selectedTableId, setselectedTableId] = useState<number | null>(null);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [config, setConfig] = useState<AppConfig>(initialConfig);
  const [isLiquidateConfirmationOpen, setIsLiquidateConfirmationOpen] =
    useState(false);
  const [activeTab, setActiveTab] = useState("tables");
  const [invalidCredentials, setInvalidCredentials] = useState(false);
  const { toast } = useToast();

  const fetchTables = useCallback(async () => {
    try {
      const tablesData = await getTables();
      if (
        tablesData?.error?.details?.status === 401 ||
        tablesData?.error?.details?.status === 403
      ) {
        removeStrapiToken();
        setIsLoggedIn(false);
        return;
      }
      if (tablesData?.data) {
        console.log("TABLES:", tablesData);
        setTables(tablesData.data);
      }
    } catch (error) {
      console.error("Error fetching tables:", error);
      toast({
        title: "Error",
        description: "Failed to fetch tables from Strapi",
        variant: "destructive",
      });
    }
  }, [toast]);

  const fetchManageRecords = useCallback(async () => {
    try {
      const [
        productsData,
        categoriesData,
        subcategoriesData,
        extrasData,
        quickNotesData,
      ] = await Promise.all([
        getProducts(),
        getCategories(),
        getSubcategories(),
        getExtras(),
        getQuickNotes(),
      ]);
      if (
        productsData?.error?.details?.status === 401 ||
        productsData?.error?.details?.status === 403
      ) {
        removeStrapiToken();
        setIsLoggedIn(false);
        return;
      }
      if (productsData?.data) {
        console.log("PRODUCTS:", productsData);
        setProducts(
          productsData.data.sort((a, b) => a.name.localeCompare(b.name)),
        );
      }
      if (categoriesData?.data) {
        setCategories(
          categoriesData.data.sort((a, b) => a.name.localeCompare(b.name)),
        );
      }
      if (subcategoriesData?.data) {
        setSubcategories(
          subcategoriesData.data.sort((a, b) => a.name.localeCompare(b.name)),
        );
      }
      if (extrasData?.data) {
        setExtras(extrasData.data.sort((a, b) => a.name.localeCompare(b.name)));
      }
      if (quickNotesData?.data) {
        setQuickNotes(
          quickNotesData.data.sort((a, b) => a.name.localeCompare(b.name)),
        );
      }
    } catch (error) {
      console.error("Error fetching manage records:", error);
      toast({
        title: "Error",
        description: "Failed to fetch manage records from Strapi",
        variant: "destructive",
      });
    }
  }, [toast]);

  const fetchData = useCallback(async () => {
    await Promise.all([fetchTables(), fetchManageRecords()]);
  }, [fetchTables, fetchManageRecords]);

  useEffect(() => {
    const checkAuth = async () => {
      const token = getStrapiToken();
      if (token) {
        setIsLoggedIn(true);
        await fetchData();
      }
      setIsLoading(false);
    };
    checkAuth();
  }, [fetchData]);

  useEffect(() => {
    document.body.className = config.theme;
  }, [config.theme]);

  const handleLogin = async (username: string, password: string) => {
    setInvalidCredentials(false);
    try {
      const response = await login(username, password);
      console.log("LOGIN:", response);
      if (!response.error && response.jwt) {
        setStrapiToken(response.jwt);
        setIsLoggedIn(true);
        await fetchData();
      } else {
        setInvalidCredentials(true);
      }
    } catch (error) {
      console.error("Error logging in:", error);
      setInvalidCredentials(true);
    }
  };

  const totalByOrders = useCallback(
    (orders: OrderData[]): number => calculateTotalByOrders(orders),
    [],
  );

  const unpaidTotalByOrders = useCallback(
    (orders: OrderData[]): number => calculateUnpaidTotalByOrders(orders),
    [],
  );

  const handleAddProduct = async (product: ProductData) => {
    if (!selectedTableId || !product) return;
    try {
      const createOrderRequest: Omit<
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
      } = {
        quantity: 1,
        prepared: product.alwaysPrepared,
        served: false,
        paid: false,
        product: product.id,
        extras: [],
        notes: "",
        table: selectedTableId,
      };

      createOrder(createOrderRequest).then(() => {
        fetchTables();
        if (!config.disableNotifications) {
          toast({
            title: "Producto añadido",
            description: `${product.name} ha sido añadido a la mesa ${tables.find((t) => t.id === selectedTableId)?.number}.`,
            duration: config.notificationDuration,
          });
        }
      });
    } catch (error) {
      console.error("Error adding product:", error);
      toast({
        title: "Error",
        description: "Failed to add product to order",
        duration: config.notificationDuration,
        variant: "destructive",
      });
    }
  };

  const handleUpdateStatus = async (
    orderDocumentId: string,
    prepared: boolean,
    served: boolean,
  ) => {
    try {
      updateOrder(orderDocumentId, { prepared, served }).then(() => {
        fetchTables();
        if (!config.disableNotifications) {
          if (prepared && !served) {
            toast({
              title: "Producto preparado",
              description: "El producto ha sido marcado como preparado.",
              duration: config.notificationDuration,
              action: allOrders.find((o) => o.documentId === orderDocumentId)
                ?.product.alwaysPrepared ? undefined : (
                <Button
                  variant="outline"
                  onClick={() => {
                    handleUpdateStatus(orderDocumentId, false, false);
                    toast({
                      title: "Acción deshecha",
                      description:
                        "El producto ha sido marcado como no preparado.",
                      duration: config.notificationDuration,
                    });
                  }}
                >
                  No preparado
                </Button>
              ),
            });
          } else if (served) {
            toast({
              title: "Producto servido",
              description: "El producto ha sido marcado como servido.",
              duration: config.notificationDuration,
              action: (
                <Button
                  variant="outline"
                  onClick={() => {
                    handleUpdateStatus(orderDocumentId, true, false);
                    toast({
                      title: "Acción deshecha",
                      description:
                        "El producto ha sido marcado como no servido.",
                      duration: config.notificationDuration,
                    });
                  }}
                >
                  No servido
                </Button>
              ),
            });
          }
        }
      });
    } catch (error) {
      console.error("Error updating order status:", error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        duration: config.notificationDuration,
        variant: "destructive",
      });
    }
  };

  const handleUpdateQuantity = async (
    orderDocumentId: string,
    quantity: number,
  ) => {
    try {
      updateOrder(orderDocumentId, { quantity }).then(() => fetchTables());
    } catch (error) {
      console.error("Error updating order quantity:", error);
      toast({
        title: "Error",
        description: "Failed to update order quantity",
        duration: config.notificationDuration,
        variant: "destructive",
      });
    }
  };

  const handleUpdateNotes = async (orderDocumentId: string, notes: string) => {
    try {
      updateOrder(orderDocumentId, { notes }).then(() => fetchTables());
    } catch (error) {
      console.error("Error updating order notes:", error);
      toast({
        title: "Error",
        description: "Failed to update order notes",
        duration: config.notificationDuration,
        variant: "destructive",
      });
    }
  };

  const handleUpdateExtras = async (
    orderDocumentId: string,
    extras: ExtraData[],
  ) => {
    try {
      await updateOrder(orderDocumentId, {
        extras: extras.map((extra) => extra.id),
      });
      fetchTables();
    } catch (error) {
      console.error("Error updating order extras:", error);
      toast({
        title: "Error",
        description: "Failed to update order extras",
        duration: config.notificationDuration,
        variant: "destructive",
      });
    }
  };

  const handleRemoveOrder = async (orderDocumentId: string) => {
    try {
      deleteOrder(orderDocumentId).then(() => {
        fetchTables();
        if (!config.disableNotifications) {
          toast({
            title: "Producto eliminado",
            description: "El producto ha sido eliminado del pedido.",
            duration: config.notificationDuration,
          });
        }
      });
    } catch (error) {
      console.error("Error removing product:", error);
      toast({
        title: "Error",
        description: "Failed to remove product from order",
        duration: config.notificationDuration,
        variant: "destructive",
      });
    }
  };

  const handleReleaseTable = () => {
    setIsConfirmationModalOpen(true);
  };

  const confirmReleaseTable = async () => {
    if (!selectedTableId) return;

    try {
      const selectedTable = tables.find((t) => t.id === selectedTableId);
      if (selectedTable) {
        const releasedAt = Date.now();
        await Promise.all(
          selectedTable.orders
            .filter((order) => !order.releasedAt)
            .map((order) => updateOrder(order.documentId, { releasedAt })),
        ).then(() => {
          fetchTables().then(() => {
            setselectedTableId(null);
            setIsConfirmationModalOpen(false);
            if (!config.disableNotifications) {
              toast({
                title: "Mesa liberada",
                description: `La mesa ${selectedTable.number} ha sido liberada.`,
                duration: config.notificationDuration,
              });
            }
          });
        });
      }
    } catch (error) {
      console.error("Error releasing table:", error);
      toast({
        title: "Error",
        description: "Failed to release table",
        duration: config.notificationDuration,
        variant: "destructive",
      });
    }
  };

  const handleTogglePaid = async (order: OrderData) => {
    if (!selectedTableId) return;
    try {
      if (order) {
        updateOrder(order.documentId, {
          paid: !order.paid,
        }).then(() => fetchTables());
      }
    } catch (error) {
      console.error("Error toggling paid status:", error);
      toast({
        title: "Error",
        description: "Failed to update paid status",
        duration: config.notificationDuration,
        variant: "destructive",
      });
    }
  };

  const handleLiquidateOrders = () => {
    setIsLiquidateConfirmationOpen(true);
  };

  const handleAddTable = async () => {
    const newTable: Omit<TableData, "id" | "documentId"> = {
      number: tables.length + 1,
      orders: [],
    };

    try {
      createTable(newTable).then(() => fetchTables());
    } catch (error) {
      console.error("Error adding table:", error);
      toast({
        title: "Error",
        description: "Failed to add table",
        duration: config.notificationDuration,
        variant: "destructive",
      });
    }
  };

  const handleDeleteTable = async () => {
    const lastTable = tables[tables.length - 1];
    if (!lastTable) return;
    try {
      deleteTable(lastTable.documentId).then(() => fetchTables());
    } catch (error) {
      console.error("Error deleting table:", error);
      toast({
        title: "Error",
        description: "Failed to delete table",
        duration: config.notificationDuration,
        variant: "destructive",
      });
    }
  };

  const confirmLiquidateOrders = () => {
    Promise.all(
      releasedOrders.map((order) => deleteOrder(order.documentId)),
    ).then(() => {
      fetchTables();
      setIsOrderDialogOpen(false);
      setIsLiquidateConfirmationOpen(false);
      if (!config.disableNotifications) {
        toast({
          title: "Pedidos liquidados",
          description: "Todos los pedidos han sido liquidados.",
          duration: config.notificationDuration,
        });
      }
    });
  };

  const statusColorByOrders = useCallback(
    (orders: OrderData[]) => getStatusColorByOrders(orders),
    [],
  );
  const allOrders: OrderData[] = tables.flatMap(({ orders }) => orders);
  const releasedOrders = allOrders.filter((order) => order.releasedAt);
  const groupedReleasedOrders = releasedOrders.reduce(
    (acc, order) => {
      const { releasedAt } = order;
      if (!acc[releasedAt]) {
        acc[releasedAt] = [];
      }
      acc[releasedAt].push(order);
      return acc;
    },
    {} as Record<number, OrderData[]>,
  );

  const isPendingPreparation = (order: OrderData | undefined): boolean => {
    if (!order) return false;
    return !order.prepared && !order.served && !order.releasedAt;
  };

  const pendingPreparation: OrderData[] = allOrders.filter(
    (order): order is OrderData => {
      return order !== undefined && isPendingPreparation(order);
    },
  );

  const isPendingService = (order: OrderData | undefined): boolean => {
    if (!order) return false;
    return order.prepared && !order.served && !order.releasedAt;
  };

  const pendingService: OrderData[] = allOrders.filter(
    (order): order is OrderData => {
      return order !== undefined && isPendingService(order);
    },
  );

  const calculateTotalLiquidation = () => {
    return tables?.reduce(
      (total, table) => total + totalByOrders(table.orders),
      0,
    );
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-2xl font-semibold">Iniciando...</div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <Login onLogin={handleLogin} invalidCredentials={invalidCredentials} />
    );
  }

  return (
    <div className={`container mx-auto p-2 ${config.theme}`}>
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <div className="flex space-x-2">
          <div className="flex-1" onClick={() => setselectedTableId(null)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="tables" className="text-lg">
                <span className="hidden md:inline">Mesas</span>
                <Home className="inline md:hidden m-1" />
              </TabsTrigger>
              <TabsTrigger value="kitchen" className="text-lg">
                <span className="hidden md:inline">Cocina</span>
                <ChefHat className="inline md:hidden m-1" />
                {pendingPreparation.length > 0 && (
                  <span className="ml-2 px-2 py-1 bg-yellow-400 text-black rounded-full text-xs">
                    {pendingPreparation.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="service" className="text-lg">
                <span className="hidden md:inline">Servicio</span>
                <HandPlatter className="inline md:hidden m-1" />
                {pendingService.length > 0 && (
                  <span className="ml-2 px-2 py-1 bg-blue-400 text-black rounded-full text-xs">
                    {pendingService.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </div>
          <div className="space-x-2">
            <Config
              isSettingsOpen={isConfigOpen}
              setIsSettingsOpen={setIsConfigOpen}
              config={config}
              setConfig={setConfig}
              tables={tables}
              handleAddTable={handleAddTable}
              handleDeleteTable={handleDeleteTable}
              categories={categories}
              subcategories={subcategories}
              quickNotes={quickNotes}
              extras={extras}
              products={products}
              onUpdate={() => {
                fetchManageRecords();
                fetchTables();
              }}
            />
            <ReleasedOrders
              isOrderDialogOpen={isOrderDialogOpen}
              setIsOrderDialogOpen={setIsOrderDialogOpen}
              releasedOrders={releasedOrders}
              groupedReleasedOrders={groupedReleasedOrders}
              totalByOrders={totalByOrders}
              handleLiquidateOrders={handleLiquidateOrders}
              calculateTotalLiquidation={calculateTotalLiquidation}
            />
          </div>
        </div>
        <TabsContent value="tables">
          {selectedTableId ? (
            <TableDetail
              tableNumber={
                tables.find((t) => t.id === selectedTableId)?.number ?? 0
              }
              orders={
                tables
                  .find((t) => t.id === selectedTableId)
                  ?.orders?.filter((order) => !order.releasedAt) || []
              }
              availableProducts={products}
              onAddProduct={handleAddProduct}
              onUpdateStatus={handleUpdateStatus}
              onUpdateQuantity={handleUpdateQuantity}
              onUpdateNotes={handleUpdateNotes}
              onUpdateExtras={handleUpdateExtras}
              onRemoveOrder={handleRemoveOrder}
              onReleaseTable={handleReleaseTable}
              onTogglePaid={handleTogglePaid}
              unpaidTotal={
                unpaidTotalByOrders(
                  tables
                    .find((t) => t.id === selectedTableId)
                    ?.orders?.filter((order) => !order.releasedAt) || [],
                ) || 0
              }
            />
          ) : (
            <TableOverview
              tables={tables}
              onTableSelect={setselectedTableId}
              getTableColor={statusColorByOrders}
              calculateTableUnpaidTotal={unpaidTotalByOrders}
            />
          )}
        </TabsContent>
        <TabsContent value="kitchen">
          <Kitchen
            pendingPreparation={pendingPreparation}
            handleUpdateStatus={handleUpdateStatus}
          />
        </TabsContent>
        <TabsContent value="service">
          <Service
            pendingService={pendingService}
            handleUpdateStatus={handleUpdateStatus}
          />
        </TabsContent>
      </Tabs>

      <ConfirmationModal
        isOpen={isConfirmationModalOpen}
        onClose={() => setIsConfirmationModalOpen(false)}
        onConfirm={confirmReleaseTable}
        title="Confirmar liberación de mesa"
        description="¿Estás seguro de que quieres liberar esta mesa? Todos los productos asociados serán eliminados."
      />
      <ConfirmationModal
        isOpen={isLiquidateConfirmationOpen}
        onClose={() => setIsLiquidateConfirmationOpen(false)}
        onConfirm={confirmLiquidateOrders}
        title="Confirmar liquidación de pedidos"
        description="¿Estás seguro de que quieres liquidar todos los pedidos? Esta acción no se puede deshacer."
      />
      <Toaster />
      <ScrollToTopButton />
    </div>
  );
}
