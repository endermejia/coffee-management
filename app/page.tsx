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
  deleteOrder,
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
  disableNotifications: false,
  notificationDuration: 2000,
  theme: "light",
};

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [tables, setTables] = useState<TableData[]>([]);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [selectedTable, setSelectedTable] = useState<TableData | null>(null);
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

  useEffect(() => {
    const fetchTables = async () => {
      try {
        const tablesData = await getTables();
        if (tablesData && tablesData.data) {
          console.log(tablesData);
          setTables(tablesData.data.sort((a, b) => a.number - b.number));
        }
      } catch (error) {
        console.error("Error fetching tables:", error);
        toast({
          title: "Error",
          description: "Failed to fetch tables from Strapi",
          duration: 3000,
          variant: "destructive",
        });
      }
    };
    fetchTables();
  }, [toast]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const productsData = await getProducts();

        if (productsData && productsData.data) {
          console.log(productsData);
          setProducts(productsData.data);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
        toast({
          title: "Error",
          description: "Failed to fetch products from Strapi",
          duration: 3000,
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
    if (username === "admin" && password === "password") {
      setIsLoggedIn(true);
    } else {
      alert("Credenciales incorrectas");
    }
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
    if (!selectedTable || !product) return;

    try {
      const createOrderRequest: Omit<
        OrderData,
        "id" | "tableId" | "tableNumber" | "product"
      > & {
        table: number;
        product: number;
      } = {
        quantity: 1,
        prepared: product.alwaysPrepared,
        served: false,
        paid: false,
        product: product.id,
        notes: "",
        releasedAt: 0,
        table: selectedTable.id,
      };

      const response = await createOrder(createOrderRequest);
      if (response.data && response.data.length > 0) {
        setTables((prevTables) =>
          prevTables.map((table) =>
            table.id === selectedTable.id
              ? {
                  ...table,
                  orders: Array.isArray(table.orders)
                    ? [...table.orders, response.data[0]]
                    : [response.data[0]],
                }
              : table,
          ),
        );

        setSelectedTable((prevTable) => {
          if (prevTable) {
            return {
              ...prevTable,
              orders: Array.isArray(prevTable.orders)
                ? [...prevTable.orders, response.data[0]]
                : [response.data[0]],
            };
          }
          return prevTable;
        });

        if (!config.disableNotifications) {
          toast({
            title: "Producto añadido",
            description: `${product.name} ha sido añadido a la mesa ${selectedTable.number}.`,
            duration: config.notificationDuration,
          });
        }
      }
    } catch (error) {
      console.error("Error adding product:", error);
      toast({
        title: "Error",
        description: "Failed to add product to order",
        duration: 3000,
        variant: "destructive",
      });
    }
  };

  const handleUpdateStatus = async (
    orderId: number,
    prepared: boolean,
    served: boolean,
  ) => {
    if (!selectedTable) return;

    try {
      const response = await updateOrder(orderId, { prepared, served });
      if (response.data) {
        console.log("PRODUCTO ACTUALIZADO:", response.data);

        if (!config.disableNotifications) {
          if (prepared && !served) {
            toast({
              title: "Producto preparado",
              description: "El producto ha sido marcado como preparado.",
              duration: config.notificationDuration,
              action: (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    handleUpdateStatus(orderId, false, false);
                    toast({
                      title: "Acción deshecha",
                      description:
                        "El producto ha sido marcado como no preparado.",
                      duration: config.notificationDuration,
                    });
                  }}
                >
                  Deshacer
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
                  size="sm"
                  onClick={() => {
                    handleUpdateStatus(orderId, true, false);
                    toast({
                      title: "Acción deshecha",
                      description:
                        "El producto ha sido marcado como no servido.",
                      duration: config.notificationDuration,
                    });
                  }}
                >
                  Deshacer
                </Button>
              ),
            });
          }
        }
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        duration: 3000,
        variant: "destructive",
      });
    }
  };

  const handleUpdateQuantity = async (orderId: number, quantity: number) => {
    if (!selectedTable) return;

    try {
      const response = await updateOrder(orderId, { quantity });
      if (response.data) {
        setTables((prevTables) =>
          prevTables.map((table) =>
            table.id === selectedTable.id
              ? {
                  ...table,
                  orders: table.orders.map((order) =>
                    order.id === orderId ? { ...order, quantity } : order,
                  ),
                }
              : table,
          ),
        );
      }
    } catch (error) {
      console.error("Error updating order quantity:", error);
      toast({
        title: "Error",
        description: "Failed to update order quantity",
        duration: 3000,
        variant: "destructive",
      });
    }
  };

  const handleUpdateNotes = async (orderId: number, notes: string) => {
    if (!selectedTable) return;

    try {
      const response = await updateOrder(orderId, { notes });
      if (response.data) {
        setTables((prevTables) =>
          prevTables.map((table) =>
            table.id === selectedTable.id
              ? {
                  ...table,
                  orders: table.orders.map((order) =>
                    order.id === orderId ? { ...order, notes } : order,
                  ),
                }
              : table,
          ),
        );
      }
    } catch (error) {
      console.error("Error updating order notes:", error);
      toast({
        title: "Error",
        description: "Failed to update order notes",
        duration: 3000,
        variant: "destructive",
      });
    }
  };

  const handleRemoveOrder = async (orderId: number) => {
    if (!selectedTable) return;

    try {
      await deleteOrder(orderId);
      setTables((prevTables) =>
        prevTables.map((table) =>
          table.id === selectedTable.id
            ? {
                ...table,
                orders: table.orders.filter((order) => order.id !== orderId),
              }
            : table,
        ),
      );

      if (!config.disableNotifications) {
        toast({
          title: "Producto eliminado",
          description: "El producto ha sido eliminado del pedido.",
          duration: config.notificationDuration,
        });
      }
    } catch (error) {
      console.error("Error removing product:", error);
      toast({
        title: "Error",
        description: "Failed to remove product from order",
        duration: 3000,
        variant: "destructive",
      });
    }
  };

  const handleReleaseTable = () => {
    setIsConfirmationModalOpen(true);
  };

  const confirmReleaseTable = async () => {
    if (!selectedTable) return;

    try {
      if (selectedTable) {
        await Promise.all(
          selectedTable.orders.map((order) =>
            updateOrder(order.id, { releasedAt: Date.now() }),
          ),
        ).then(() => {
          console.log("Orders released");
        });

        setTables((prevTables) =>
          prevTables.map((t) =>
            t.id === selectedTable.id ? { ...t, orders: [] } : t,
          ),
        );

        setSelectedTable(null);
        setIsConfirmationModalOpen(false);

        if (!config.disableNotifications) {
          toast({
            title: "Mesa liberada",
            description: `La mesa ${selectedTable} ha sido liberada.`,
            duration: config.notificationDuration,
          });
        }
      }
    } catch (error) {
      console.error("Error releasing table:", error);
      toast({
        title: "Error",
        description: "Failed to release table",
        duration: 3000,
        variant: "destructive",
      });
    }
  };

  const handleTogglePaid = async (orderId: number) => {
    if (!selectedTable) return;

    try {
      const order = selectedTable?.orders.find((o) => o.id === orderId);
      if (order) {
        const response = await updateOrder(orderId, { paid: !order.paid });
        if (response.data) {
          setTables((prevTables) =>
            prevTables.map((t) =>
              t.id === selectedTable.id
                ? {
                    ...t,
                    orders: t.orders.map((o) =>
                      o.id === orderId ? { ...o, paid: !o.paid } : o,
                    ),
                  }
                : t,
            ),
          );
        }
      }
    } catch (error) {
      console.error("Error toggling paid status:", error);
      toast({
        title: "Error",
        description: "Failed to update paid status",
        duration: 3000,
        variant: "destructive",
      });
    }
  };

  const handleLiquidateOrders = () => {
    setIsLiquidateConfirmationOpen(true);
  };

  const confirmLiquidateOrders = () => {
    setIsOrderDialogOpen(false);
    setIsLiquidateConfirmationOpen(false);
    if (!config.disableNotifications) {
      toast({
        title: "Pedidos liquidados",
        description: "Todos los pedidos han sido liquidados.",
        duration: config.notificationDuration,
      });
    }
  };

  const getTableColor = (table: TableData) => {
    if (!table.orders || !table.orders.length) return "bg-gray-200";
    if (table.orders.some((order: OrderData) => !order.prepared))
      return table.orders.some(
        (order: OrderData) => order.prepared && !order.served,
      )
        ? "bg-gradient-to-r from-yellow-200 to-blue-200"
        : "bg-yellow-200";
    if (table.orders.some((order: OrderData) => !order.served))
      return "bg-blue-200";
    return "bg-green-200";
  };

  const handleStatusChange = (
    productId: number,
    prepared: boolean,
    served: boolean,
  ) => {
    console.log(
      "handleStatusChange: (productId, prepared, served)",
      productId,
      prepared,
      served,
    );

    if (!config.disableNotifications) {
      if (prepared && !served) {
        toast({
          title: "Producto preparado",
          description: "El producto ha sido marcado como preparado.",
          duration: config.notificationDuration,
          action: (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                handleStatusChange(productId, false, false);
                toast({
                  title: "Acción deshecha",
                  description: "El producto ha sido marcado como no preparado.",
                  duration: config.notificationDuration,
                });
              }}
            >
              Deshacer
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
              size="sm"
              onClick={() => {
                handleStatusChange(productId, true, false);
                toast({
                  title: "Acción deshecha",
                  description: "El producto ha sido marcado como no servido.",
                  duration: config.notificationDuration,
                });
              }}
            >
              Deshacer
            </Button>
          ),
        });
      }
    }
  };

  const allOrders: OrderData[] = tables.flatMap(({ orders }) => orders);
  const realisedOrders = allOrders.filter((order) => order?.releasedAt);
  const groupedRealisedOrders = realisedOrders.reduce(
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

  // const normalizeString = (str: string) => {
  //   return str
  //     .toLowerCase()
  //     .normalize("NFD")
  //     .replace(/[\u0300-\u036f]/g, "");
  // };
  //
  // const filteredProducts = initialProducts.filter((product) =>
  //   normalizeString(product.name).includes(normalizeString(searchTerm)),
  // );

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
          <div className="flex-1" onClick={() => setSelectedTable(null)}>
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
                        disabled={
                          pendingPreparation.some(
                            (order: OrderData) =>
                              order?.tableId === tables.length,
                          ) ||
                          pendingService.some(
                            (order: OrderData) =>
                              order?.tableId === tables.length,
                          )
                        }
                        onClick={() =>
                          // TODO: pending call delete table
                          console.log("delete table")
                        }
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        id="num-tables"
                        disabled={Boolean(
                          pendingPreparation.length || pendingService.length,
                        )}
                        type="number"
                        value={tables.length}
                        onChange={(e) =>
                          // TODO
                          console.log("set tables", e.target.value)
                        }
                        min="1"
                        className="w-20 text-center"
                      />
                      <Button
                        onClick={() =>
                          // TODO
                          console.log("set tables")
                        }
                      >
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
                  disabled={realisedOrders.length === 0}
                >
                  <ClipboardList className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Registro de pedidos</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  {Object.entries(groupedRealisedOrders).map(
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
                            {new Date(releasedAt).toLocaleString()}
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
                      disabled={realisedOrders.length === 0}
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
          {selectedTable ? (
            <TableDetail
              table={selectedTable}
              orders={
                selectedTable.orders?.filter((order) => !order.releasedAt) || []
              }
              availableProducts={products}
              onAddProduct={handleAddProduct}
              onUpdateStatus={handleUpdateStatus}
              onUpdateQuantity={handleUpdateQuantity}
              onUpdateNotes={handleUpdateNotes}
              onRemoveOrder={handleRemoveOrder}
              onReleaseTable={handleReleaseTable}
              onTogglePaid={handleTogglePaid}
              unpaidTotal={
                calculateUnpaidTotalByOrders(
                  tables.find((t) => t.id === selectedTable.id)?.orders || [],
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
              onTableSelect={setSelectedTable}
              getTableColor={getTableColor}
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
                          Mesa {order.tableId}
                        </span>
                        <Checkbox
                          checked={order.prepared}
                          onCheckedChange={(checked) =>
                            handleStatusChange(
                              order.id,
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
                          Mesa {order.tableId}
                        </span>
                        <Checkbox
                          checked={order.served}
                          onCheckedChange={(checked) =>
                            handleStatusChange(
                              order.id,
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
