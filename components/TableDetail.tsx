import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileText, Plus } from "lucide-react";
import { ExtraData, OrderData, ProductData } from "@/lib/strapi";

interface TableDetailProps {
  children: React.ReactNode;
  tableNumber: number;
  orders: OrderData[];
  availableProducts: ProductData[];
  onAddProduct: (product: ProductData) => void;
  onUpdateStatus: (
    orderDocumentId: string,
    prepared: boolean,
    served: boolean,
  ) => void;
  onUpdateQuantity: (orderDocumentId: string, quantity: number) => void;
  onUpdateNotes: (orderDocumentId: string, notes: string) => void;
  onUpdateExtras: (orderDocumentId: string, extras: ExtraData[]) => void;
  onRemoveOrder: (orderDocumentId: string) => void;
  onReleaseTable: () => void;
  onTogglePaid: (order: OrderData) => void;
  unpaidTotal: number;
}

const quickNotes = [
  "Sin hielo",
  "Sin azúcar",
  "Para llevar",
  "Extra caliente",
  "Sin lactosa",
  "Sin gluten",
  "Poco hecho",
  "Muy hecho",
];

export default function TableDetail({
  tableNumber,
  orders,
  availableProducts,
  onAddProduct,
  onUpdateStatus,
  onUpdateQuantity,
  onUpdateNotes,
  onUpdateExtras,
  onRemoveOrder,
  onReleaseTable,
  onTogglePaid,
  unpaidTotal,
}: TableDetailProps) {
  const [, setSelectedCategory] = useState<"bebida" | "comida">("bebida");
  const [noteOrder, setNoteOrder] = useState<OrderData | null>(null);
  const [noteText, setNoteText] = useState("");
  const [extrasOrder, setExtrasOrder] = useState<OrderData | null>(null);
  const [extras, setExtras] = useState<ExtraData[] | null>(null);

  const getStatusColor = (prepared: boolean, served: boolean) => {
    if (served) return "bg-green-200";
    if (prepared) return "bg-blue-200";
    return "bg-yellow-200";
  };

  const handleQuantityChange = (order: OrderData, newQuantity: number) => {
    if (order.paid) return;

    if (newQuantity === 0) {
      onRemoveOrder(order.documentId);
    } else {
      onUpdateQuantity(order.documentId, newQuantity);
    }
  };

  const handleAddNote = (order: OrderData) => {
    setNoteOrder(order);
    setNoteText(order?.notes || "");
  };

  const handleSaveNote = () => {
    if (noteOrder !== null) {
      onUpdateNotes(noteOrder.documentId, noteText);
      setNoteOrder(null);
      setNoteText("");
    }
  };

  const addQuickNote = (note: string) => {
    setNoteText((prev) => (prev ? `${prev}, ${note}` : note));
  };

  const handleAddExtra = (order: OrderData) => {
    setExtrasOrder(order);
    setExtras(order.extras);
  };

  const addExtra = (extra: ExtraData) => {
    if (extras?.find((e) => e.id === extra.id)) {
      setExtras(
        (prevExtras) => prevExtras?.filter((e) => e.id !== extra.id) || [],
      );
    } else {
      setExtras([...(extras || []), extra]);
    }
  };

  const handleSaveExtras = () => {
    if (extrasOrder !== null) {
      onUpdateExtras(extrasOrder.documentId, extras || []);
      setExtrasOrder(null);
      setExtras(null);
    }
  };

  const groupedAvailableProducts: Record<
    string,
    Record<string, ProductData[]>
  > = availableProducts.reduce(
    (
      acc: Record<string, Record<string, ProductData[]>>,
      product: ProductData,
    ) => {
      if (!acc[product.category?.name]) {
        acc[product.category?.name] = {};
      }
      if (!acc[product.category?.name][product.subcategory?.name]) {
        acc[product.category?.name][product.subcategory?.name] = [];
      }
      acc[product.category?.name][product.subcategory?.name].push(product);
      return acc;
    },
    {} as Record<string, Record<string, ProductData[]>>,
  );

  return (
    <div className="space-y-8">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-xl">AÑADIR PRODUCTOS</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs
            defaultValue="bebida"
            onValueChange={(value) =>
              setSelectedCategory(value as "bebida" | "comida")
            }
          >
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="bebida" className="text-lg">
                BEBIDAS
              </TabsTrigger>
              <TabsTrigger value="comida" className="text-lg">
                COMIDAS
              </TabsTrigger>
            </TabsList>
            <TabsContent value="bebida">
              {Object.entries(groupedAvailableProducts["bebida"] || {}).map(
                ([subcategory, products]) => (
                  <Accordion type="single" collapsible key={subcategory}>
                    <AccordionItem value={subcategory}>
                      <AccordionTrigger>
                        {subcategory.toUpperCase()}
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-2 gap-2">
                          {products.map((product) => (
                            <Button
                              key={product.id}
                              onClick={() => onAddProduct(product)}
                              variant="outline"
                              className="justify-start"
                            >
                              {product.name}
                            </Button>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                ),
              )}
            </TabsContent>
            <TabsContent value="comida">
              {Object.entries(groupedAvailableProducts["comida"] || {}).map(
                ([subcategory, products]) => (
                  <Accordion type="single" collapsible key={subcategory}>
                    <AccordionItem value={subcategory}>
                      <AccordionTrigger>
                        {subcategory.toUpperCase()}
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-2 gap-2">
                          {products.map((product) => (
                            <Button
                              key={product.id}
                              onClick={() => onAddProduct(product)}
                              variant="outline"
                              className="justify-start"
                            >
                              {product.name}
                            </Button>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                ),
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      {orders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">PRODUCTOS PEDIDOS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {orders.map((order: OrderData) => (
                <Card
                  key={order.id}
                  className={`${getStatusColor(order.prepared, order.served)} p-4`}
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <div className="flex-1 mb-2 sm:mb-0">
                      <h3
                        className={`font-semibold cursor-pointer ${order.paid ? "line-through text-gray-500" : ""}`}
                        onClick={() => onTogglePaid(order)}
                      >
                        {order.product.name}{" "}
                        {order.quantity > 1
                          ? `(${order.product.price.toFixed(2)} € x ${order.quantity} = ${(order.product.price * order.quantity).toFixed(2)} €)`
                          : `${order.product.price.toFixed(2)} €`}
                      </h3>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                      <div className="flex items-center space-x-2">
                        <Button
                          onClick={() =>
                            handleQuantityChange(order, order.quantity - 1)
                          }
                          variant="outline"
                          size="icon"
                          disabled={
                            order.paid ||
                            order.served ||
                            (!order.product.alwaysPrepared && order.prepared)
                          }
                        >
                          -
                        </Button>
                        <Input
                          type="number"
                          value={order.quantity}
                          onChange={(e) =>
                            handleQuantityChange(
                              order,
                              parseInt(e.target.value) || 0,
                            )
                          }
                          className="w-16 text-center"
                          disabled={
                            order.paid ||
                            order.served ||
                            (!order.product.alwaysPrepared && order.prepared)
                          }
                        />
                        <Button
                          onClick={() =>
                            handleQuantityChange(order, order.quantity + 1)
                          }
                          variant="outline"
                          size="icon"
                          disabled={
                            order.paid ||
                            order.served ||
                            (!order.product.alwaysPrepared && order.prepared)
                          }
                        >
                          +
                        </Button>
                      </div>
                      <div className="flex items-center space-x-2">
                        {!order.product.alwaysPrepared && (
                          <div className="flex flex-col items-center">
                            <Checkbox
                              id={`prepared-${order.id}`}
                              checked={order.prepared}
                              onCheckedChange={(checked) =>
                                onUpdateStatus(
                                  order.documentId,
                                  checked as boolean,
                                  order.served,
                                )
                              }
                              disabled={order.served}
                            />
                            <label
                              htmlFor={`prepared-${order.id}`}
                              className="text-xs"
                            >
                              Prep
                            </label>
                          </div>
                        )}
                        <div className="flex flex-col items-center">
                          <Checkbox
                            id={`served-${order.id}`}
                            checked={order.served}
                            onCheckedChange={(checked) =>
                              onUpdateStatus(
                                order.documentId,
                                true,
                                checked as boolean,
                              )
                            }
                            disabled={
                              !order.prepared && !order.product.alwaysPrepared
                            }
                          />
                          <label
                            htmlFor={`served-${order.id}`}
                            className="text-xs"
                          >
                            Serv
                          </label>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {!!order.product.extras?.length && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAddExtra(order)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Extras
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAddNote(order)}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Nota
                        </Button>
                      </div>
                    </div>
                  </div>
                  {order.notes && (
                    <p className="mt-2 text-sm text-gray-600">{order.notes}</p>
                  )}
                  {order.extras.map((extra) => (
                    <p key={extra.id} className="mt-2 text-sm text-gray-600">
                      + {extra.name} ({extra.price.toFixed(2)} €)
                    </p>
                  ))}
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      <Card className="sticky bottom-2 bg-primary text-primary-foreground">
        <CardContent className="flex justify-between items-center p-6">
          <CardTitle className="text-2xl">Mesa {tableNumber}</CardTitle>
          <Button onClick={onReleaseTable}>
            <span className="text-3xl font-bold">
              {unpaidTotal.toFixed(2)} €
            </span>
          </Button>
        </CardContent>
      </Card>
      <Dialog
        open={extrasOrder !== null}
        onOpenChange={(open) => !open && setExtrasOrder(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Añadir extra</DialogTitle>
          </DialogHeader>
          <div className="flex flex-wrap gap-2 mb-4">
            {extrasOrder?.product.extras.map((extra, index) => (
              <Button
                key={index}
                variant={
                  extras?.some((e) => e.id === extra.id)
                    ? "default"
                    : "secondary"
                }
                onClick={() => addExtra(extra)}
              >
                {extra.name} ({extra.price.toFixed(2)} €)
              </Button>
            ))}
          </div>
          <Button onClick={handleSaveExtras}>Guardar extras</Button>
        </DialogContent>
      </Dialog>
      <Dialog
        open={noteOrder !== null}
        onOpenChange={(open) => !open && setNoteOrder(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Añadir nota</DialogTitle>
          </DialogHeader>
          <Textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Escribe una nota..."
            className="mb-4"
          />
          <div className="flex flex-wrap gap-2 mb-4">
            {quickNotes.map((note, index) => (
              <Button
                key={index}
                variant="outline"
                onClick={() => addQuickNote(note)}
              >
                {note}
              </Button>
            ))}
          </div>
          <Button onClick={handleSaveNote}>Guardar nota</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
