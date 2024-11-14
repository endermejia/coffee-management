"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  ChefHat,
  ChevronsUp,
  ClipboardList,
  HandPlatter,
  Home,
  Minus,
  Plus,
  Search,
  Settings,
} from "lucide-react";
import Login from "../components/Login";
import TableOverview from "../components/TableOverview";
import TableDetail from "../components/TableDetail";
import ConfirmationModal from "../components/ConfirmationModal";
import {
  createOrder,
  createTable,
  deleteOrder,
  deleteTable,
  ExtraData,
  getProducts,
  getTables,
  OrderData,
  ProductData,
  TableData,
  updateOrder,
} from "@/lib/strapi";

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
  const [tables, setTables] = useState<TableData[]>([]);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [selectedTableId, setselectedTableId] = useState<number | null>(null);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [config, setConfig] = useState<AppConfig>(initialConfig);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLiquidateConfirmationOpen, setIsLiquidateConfirmationOpen] =
    useState(false);
  const [activeTab, setActiveTab] = useState("tables");
  const { toast } = useToast();

  const fetchTables = useCallback(async () => {
    try {
      await getTables().then((tablesData) => {
        if (tablesData?.data) {
          console.log("TABLES:", tablesData.data);
          setTables(tablesData.data);
        }
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to fetch tables from Strapi",
        duration: config.notificationDuration,
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const productsData = await getProducts();
        if (productsData && productsData.data) {
          console.log("PRODUCTS:", productsData.data);
          setProducts(productsData.data);
        }
      } catch {
        toast({
          title: "Error",
          description: "Failed to fetch products from Strapi",
          duration: config.notificationDuration,
          variant: "destructive",
        });
      }
    };
    fetchProducts();
  }, [toast]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollToTop(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.className = config.theme;
  }, [config.theme]);

  const handleLogin = (username: string, password: string) => {
    setIsLoggedIn(true);
    // TODO: implement Auth
    console.log(username, password);
  };

  const calculateTotalByOrders = useCallback((orders: OrderData[]): number => {
    return orders?.reduce(
      (total, order) => total + order.product.price * order.quantity,
      0,
    );
  }, []);

  const calculateUnpaidTotalByOrders = useCallback(
    (orders: OrderData[]): number => {
      return orders?.reduce(
        (total, order) =>
          total + order.product.price * order.quantity * (order.paid ? 0 : 1),
        0,
      );
    },
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
        await Promise.all(
          selectedTable.orders.map((order) =>
            updateOrder(order.documentId, { releasedAt: Date.now() }),
          ),
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

  const getOrdersStatusColor = (orders: OrderData[]) => {
    if (!orders || !orders.length) return "bg-gray-200";
    if (orders.some((order: OrderData) => !order.prepared))
      return orders.some((order: OrderData) => order.prepared && !order.served)
        ? "bg-gradient-to-r from-yellow-200 to-blue-200"
        : "bg-yellow-200";
    if (orders.some((order: OrderData) => !order.served)) return "bg-blue-200";
    return "bg-green-200";
  };

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
      (total, table) => total + calculateTotalByOrders(table.orders),
      0,
    );
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
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
            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Configuración</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="disable-notifications">
                      Deshabilitar notificaciones
                    </Label>
                    <Switch
                      id="disable-notifications"
                      checked={config.disableNotifications}
                      onCheckedChange={(checked) =>
                        setConfig((prev) => ({
                          ...prev,
                          disableNotifications: checked,
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="notification-duration">
                      Duración de notificaciones (segundos)
                    </Label>
                    <Input
                      id="notification-duration"
                      type="number"
                      value={config.notificationDuration / 1000}
                      onChange={(e) => {
                        const value = Math.max(1, parseInt(e.target.value));
                        setConfig((prev) => ({
                          ...prev,
                          notificationDuration: value * 1000,
                        }));
                      }}
                      min="1"
                      className="w-20 text-center"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="theme">Modo oscuro</Label>
                    <Switch
                      id="theme"
                      checked={config.theme === "dark"}
                      onCheckedChange={(checked) =>
                        setConfig((prev) => ({
                          ...prev,
                          theme: checked ? "dark" : "light",
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="num-tables">Número de mesas</Label>
                    <div className="flex items-center space-x-2">
                      <Button
                        disabled={Boolean(
                          tables[tables.length - 1]?.orders.length,
                        )}
                        onClick={handleDeleteTable}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        id="num-tables"
                        disabled
                        type="number"
                        value={tables.length}
                        className="w-20 text-center"
                      />
                      <Button onClick={handleAddTable}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog
              open={isOrderDialogOpen}
              onOpenChange={setIsOrderDialogOpen}
            >
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={releasedOrders.length === 0}
                >
                  <ClipboardList className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Registro de pedidos</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  {Object.entries(groupedReleasedOrders).map(
                    ([releasedAt, orders]: [string, OrderData[]]) => (
                      <Card key={releasedAt} className="mb-4">
                        <CardHeader>
                          <CardTitle>
                            Mesa {orders[0].tableNumber} - Total:{" "}
                            {calculateTotalByOrders(orders).toFixed(2)} €
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-muted-foreground text-sm mb-2">
                            {new Date(Number(releasedAt)).toLocaleString()}
                          </p>
                          <ul>
                            {orders.map((order: OrderData) => (
                              <li key={order.id}>
                                {order.product.name} x{order.quantity} -{" "}
                                {(order.product.price * order.quantity).toFixed(
                                  2,
                                )}{" "}
                                €
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    ),
                  )}
                </div>
                <Card className="sticky bottom-2 bg-primary text-primary-foreground flex-grow">
                  <CardContent className="flex justify-between items-center p-4">
                    <CardTitle className="text-xl">TOTAL</CardTitle>
                    <Button
                      onClick={handleLiquidateOrders}
                      disabled={releasedOrders.length === 0}
                    >
                      <span className="text-2xl font-bold">
                        {calculateTotalLiquidation().toFixed(2)} €
                      </span>
                    </Button>
                  </CardContent>
                </Card>
              </DialogContent>
            </Dialog>
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
                calculateUnpaidTotalByOrders(
                  tables
                    .find((t) => t.id === selectedTableId)
                    ?.orders?.filter((order) => !order.releasedAt) || [],
                ) || 0
              }
            >
              <div className="mb-4">
                <Label htmlFor="product-search">Buscar producto</Label>
                <div className="flex items-center mt-1">
                  <Search className="w-5 h-5 mr-2 text-gray-400" />
                  <Input
                    id="product-search"
                    type="text"
                    placeholder="Buscar producto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-grow"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {products.map((product) => (
                  <Button
                    key={product.id}
                    onClick={() => handleAddProduct(product)}
                    className="text-left"
                  >
                    {product.name}
                  </Button>
                ))}
              </div>
            </TableDetail>
          ) : (
            <TableOverview
              tables={tables}
              onTableSelect={setselectedTableId}
              getTableColor={getOrdersStatusColor}
              calculateTableUnpaidTotal={calculateUnpaidTotalByOrders}
            />
          )}
        </TabsContent>

        <TabsContent value="kitchen">
          <Card>
            <CardHeader>
              <CardTitle>Pendiente de preparar</CardTitle>
            </CardHeader>
            <CardContent>
              {pendingPreparation.map(
                (order: OrderData) =>
                  order && (
                    <div
                      key={order.id}
                      className="mb-2 p-2 border rounded transition-opacity duration-300"
                      style={{ opacity: order.prepared ? 0.5 : 1 }}
                    >
                      <div className="flex justify-between items-center">
                        <span className="flex-1 space-x-2">
                          {order.quantity > 1 && (
                            <span className="text-muted-foreground">
                              {order.quantity} x
                            </span>
                          )}
                          <strong>{order.product.name}</strong>
                        </span>
                        <span className="text-muted-foreground mr-2">
                          Mesa {order.tableNumber}
                        </span>
                        <Checkbox
                          checked={order.prepared}
                          onCheckedChange={(checked) =>
                            handleUpdateStatus(
                              order.documentId,
                              checked as boolean,
                              order.served,
                            )
                          }
                          disabled={order.product.alwaysPrepared}
                        />
                      </div>
                      {order.notes && (
                        <span className="text-muted-foreground">
                          Notas: {order.notes}
                        </span>
                      )}
                    </div>
                  ),
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="service">
          <Card>
            <CardHeader>
              <CardTitle>Pendiente de servir</CardTitle>
            </CardHeader>
            <CardContent>
              {pendingService.map(
                (order: OrderData) =>
                  order && (
                    <div
                      key={order.id}
                      className="mb-2 p-2 border rounded transition-opacity duration-300"
                      style={{ opacity: order.served ? 0.5 : 1 }}
                    >
                      <div className="flex justify-between items-center">
                        <span className="flex-1 space-x-2">
                          {order.quantity > 1 && (
                            <span className="text-muted-foreground">
                              {order.quantity} x
                            </span>
                          )}
                          <strong>{order.product.name}</strong>
                        </span>
                        <span className="text-muted-foreground mr-2">
                          Mesa {order.tableNumber}
                        </span>
                        <Checkbox
                          checked={order.served}
                          onCheckedChange={(checked) =>
                            handleUpdateStatus(
                              order.documentId,
                              order.prepared,
                              checked as boolean,
                            )
                          }
                        />
                      </div>
                      {order.notes && (
                        <span className="text-muted-foreground">
                          Notas: {order.notes}
                        </span>
                      )}
                    </div>
                  ),
              )}
            </CardContent>
          </Card>
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
      {showScrollToTop && (
        <Button
          className="fixed top-4 right-4 rounded-full p-3 transition-opacity duration-300 z-50"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <ChevronsUp className="h-6 w-6" />
        </Button>
      )}
    </div>
  );
}
