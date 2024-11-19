import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Edit, Trash } from "lucide-react";
import {
  CategoryData,
  SubcategoryData,
  QuickNoteData,
  ExtraData,
  ProductData,
  createCategory,
  updateCategory,
  deleteCategory,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
  createQuickNote,
  updateQuickNote,
  deleteQuickNote,
  createExtra,
  updateExtra,
  deleteExtra,
  createProduct,
  updateProduct,
  deleteProduct,
} from "@/lib/strapi";

interface ManageRecordsProps {
  categories: CategoryData[];
  subcategories: SubcategoryData[];
  quickNotes: QuickNoteData[];
  extras: ExtraData[];
  products: ProductData[];
  onUpdate: () => void;
}

export default function ManageRecords({
  categories,
  subcategories,
  quickNotes,
  extras,
  products,
  onUpdate,
}: ManageRecordsProps) {
  const [activeTab, setActiveTab] = useState("category");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<
    | CategoryData
    | SubcategoryData
    | QuickNoteData
    | ExtraData
    | ProductData
    | null
  >(null);
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newProductData, setNewProductData] = useState<
    Omit<
      ProductData,
      | "id"
      | "documentId"
      | "category"
      | "subcategory"
      | "extras"
      | "quick_notes"
    > & {
      category?: number;
      subcategory?: number;
      extras?: number[];
      quick_notes?: number[];
    }
  >({
    name: "",
    price: 0,
    alwaysPrepared: false,
    category: undefined,
    subcategory: undefined,
    quick_notes: [],
    extras: [],
  });

  const resetForm = () => {
    setEditingItem(null);
    setNewItemName("");
    setNewItemPrice("");
    setNewProductData({
      name: "",
      price: 0,
      alwaysPrepared: false,
      category: undefined,
      subcategory: undefined,
      quick_notes: [],
      extras: [],
    });
  };

  const handleCreate = async () => {
    try {
      switch (activeTab) {
        case "category":
          await createCategory({ name: newItemName });
          break;
        case "subcategory":
          await createSubcategory({ name: newItemName });
          break;
        case "quickNote":
          await createQuickNote({ name: newItemName });
          break;
        case "extra":
          await createExtra({
            name: newItemName,
            price: parseFloat(newItemPrice),
          });
          break;
        case "product":
          await createProduct(newProductData);
          break;
      }
      resetForm();
      setIsDialogOpen(false);
      onUpdate();
    } catch (error) {
      console.error("Error creating item:", error);
    }
  };

  const handleUpdate = async () => {
    if (!editingItem) return;
    try {
      switch (activeTab) {
        case "category":
          await updateCategory(editingItem.documentId, { name: newItemName });
          break;
        case "subcategory":
          await updateSubcategory(editingItem.documentId, {
            name: newItemName,
          });
          break;
        case "quickNote":
          await updateQuickNote(editingItem.documentId, { name: newItemName });
          break;
        case "extra":
          await updateExtra(editingItem.documentId, {
            name: newItemName,
            price: parseFloat(newItemPrice),
          });
          break;
        case "product":
          await updateProduct(editingItem.documentId, newProductData);
          break;
      }
      resetForm();
      setIsDialogOpen(false);
      onUpdate();
    } catch (error) {
      console.error("Error updating item:", error);
    }
  };

  const handleDelete = async (
    item:
      | CategoryData
      | SubcategoryData
      | QuickNoteData
      | ExtraData
      | ProductData,
  ) => {
    try {
      switch (activeTab) {
        case "category":
          await deleteCategory(item.documentId);
          break;
        case "subcategory":
          await deleteSubcategory(item.documentId);
          break;
        case "quickNote":
          await deleteQuickNote(item.documentId);
          break;
        case "extra":
          await deleteExtra(item.documentId);
          break;
        case "product":
          await deleteProduct(item.documentId);
          break;
      }
      onUpdate();
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  const renderItems = (
    items:
      | CategoryData[]
      | SubcategoryData[]
      | QuickNoteData[]
      | ExtraData[]
      | ProductData[],
  ) => {
    return items.map((item) => (
      <Card key={item.id} className="mb-2">
        <CardContent className="flex justify-between items-center p-4">
          <span>
            {item.name}
            {"price" in item && ` - ${item.price.toFixed(2)} €`}
          </span>
          <div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setEditingItem(item);
                setNewItemName(item.name);
                if ("price" in item) {
                  setNewItemPrice(item.price?.toString() || "");
                }
                if (
                  activeTab === "product" &&
                  item?.name &&
                  "price" in item &&
                  "alwaysPrepared" in item &&
                  "category" in item &&
                  "subcategory" in item &&
                  "quick_notes" in item &&
                  "extras" in item
                ) {
                  setNewProductData({
                    name: item.name,
                    price: item.price,
                    alwaysPrepared: item.alwaysPrepared,
                    category: item.category?.id,
                    subcategory: item.subcategory?.id,
                    quick_notes: item.quick_notes.map(
                      (qn: QuickNoteData) => qn.id,
                    ),
                    extras: item.extras.map((e: ExtraData) => e.id),
                  });
                }
                setIsDialogOpen(true);
              }}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDelete(item)}
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    ));
  };

  const renderProductForm = () => (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="name" className="text-right">
          Nombre
        </Label>
        <Input
          id="name"
          value={newProductData.name}
          onChange={(e) =>
            setNewProductData({ ...newProductData, name: e.target.value })
          }
          className="col-span-3"
        />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="price" className="text-right">
          Precio
        </Label>
        <Input
          id="price"
          type="number"
          value={newProductData.price}
          onChange={(e) =>
            setNewProductData({
              ...newProductData,
              price: parseFloat(e.target.value),
            })
          }
          className="col-span-3"
        />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="category" className="text-right">
          Categoría
        </Label>
        <Select
          value={newProductData.category?.toString()}
          onValueChange={(value) =>
            setNewProductData({
              ...newProductData,
              category: parseInt(value),
            })
          }
        >
          <SelectTrigger className="col-span-3">
            <SelectValue placeholder="Seleccionar categoría" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id.toString()}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="subcategory" className="text-right">
          Subcategoría
        </Label>
        <Select
          value={newProductData.subcategory?.toString()}
          onValueChange={(value) =>
            setNewProductData({
              ...newProductData,
              subcategory: parseInt(value),
            })
          }
        >
          <SelectTrigger className="col-span-3">
            <SelectValue placeholder="Seleccionar subcategoría" />
          </SelectTrigger>
          <SelectContent>
            {subcategories.map((subcategory) => (
              <SelectItem
                key={subcategory.id}
                value={subcategory.id.toString()}
              >
                {subcategory.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="alwaysPrepared" className="text-right">
          Siempre preparado
        </Label>
        <Checkbox
          id="alwaysPrepared"
          checked={newProductData.alwaysPrepared}
          onCheckedChange={(checked) =>
            setNewProductData({
              ...newProductData,
              alwaysPrepared: checked as boolean,
            })
          }
        />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="quickNotes" className="text-right">
          Notas rápidas
        </Label>
        <div className="col-span-3 flex flex-wrap gap-2">
          {quickNotes.map((qn) => (
            <Button
              key={qn.id}
              variant={
                newProductData.quick_notes?.includes(qn.id)
                  ? "default"
                  : "outline"
              }
              onClick={() => {
                const updatedQuickNotes = newProductData.quick_notes?.includes(
                  qn.id,
                )
                  ? newProductData.quick_notes.filter((id) => id !== qn.id)
                  : [...(newProductData.quick_notes || []), qn.id];
                setNewProductData({
                  ...newProductData,
                  quick_notes: updatedQuickNotes,
                });
              }}
            >
              {qn.name}
            </Button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="extras" className="text-right">
          Extras
        </Label>
        <div className="col-span-3 flex flex-wrap gap-2">
          {extras.map((extra) => (
            <Button
              key={extra.id}
              variant={
                newProductData.extras?.includes(extra.id)
                  ? "default"
                  : "outline"
              }
              onClick={() => {
                const updatedExtras = newProductData.extras?.includes(extra.id)
                  ? newProductData.extras.filter((id) => id !== extra.id)
                  : [...(newProductData.extras || []), extra.id];
                setNewProductData({
                  ...newProductData,
                  extras: updatedExtras,
                });
              }}
            >
              {extra.name}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="category">Categorías</TabsTrigger>
          <TabsTrigger value="subcategory">Subcategorías</TabsTrigger>
          <TabsTrigger value="quickNote">Notas Rápidas</TabsTrigger>
          <TabsTrigger value="extra">Extras</TabsTrigger>
          <TabsTrigger value="product">Productos</TabsTrigger>
        </TabsList>
        <TabsContent value="category">{renderItems(categories)}</TabsContent>
        <TabsContent value="subcategory">
          {renderItems(subcategories)}
        </TabsContent>
        <TabsContent value="quickNote">{renderItems(quickNotes)}</TabsContent>
        <TabsContent value="extra">{renderItems(extras)}</TabsContent>
        <TabsContent value="product">{renderItems(products)}</TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button className="mt-4">
            <Plus className="mr-2 h-4 w-4" />
            Añadir {activeTab}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Editar" : "Añadir"} {activeTab}
            </DialogTitle>
          </DialogHeader>
          {activeTab === "product" ? (
            renderProductForm()
          ) : (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Nombre
                </Label>
                <Input
                  id="name"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="col-span-3"
                />
              </div>
              {activeTab === "extra" && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="price" className="text-right">
                    Precio
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    className="col-span-3"
                  />
                </div>
              )}
            </div>
          )}
          <Button onClick={editingItem ? handleUpdate : handleCreate}>
            {editingItem ? "Actualizar" : "Crear"}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
