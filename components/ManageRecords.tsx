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
  ProductRequest,
} from "@/lib/strapi";

interface ManageRecordsProps {
  categories: CategoryData[];
  subcategories: SubcategoryData[];
  quickNotes: QuickNoteData[];
  extras: ExtraData[];
  products: ProductData[];
  onUpdate: () => void;
}

enum Tab {
  Category = "category",
  Subcategory = "subcategory",
  QuickNote = "quickNote",
  Extra = "extra",
  Product = "product",
}

const initialProductData = {
  name: "",
  price: 0,
  alwaysPrepared: false,
  category: undefined,
  subcategory: undefined,
  quick_notes: [],
  extras: [],
};

export default function ManageRecords({
  categories,
  subcategories,
  quickNotes,
  extras,
  products,
  onUpdate,
}: ManageRecordsProps) {
  const [activeTab, setActiveTab] = useState<string>(Tab.Category);
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
  const [newProductData, setNewProductData] =
    useState<ProductRequest>(initialProductData);

  const resetForm = () => {
    setEditingItem(null);
    setNewItemName("");
    setNewItemPrice("");
    setNewProductData(initialProductData);
  };

  const handleCreateItem = async () => {
    switch (activeTab) {
      case Tab.Category:
        await createCategory({ name: newItemName });
        break;
      case Tab.Subcategory:
        await createSubcategory({ name: newItemName });
        break;
      case Tab.QuickNote:
        await createQuickNote({ name: newItemName });
        break;
      case Tab.Extra:
        await createExtra({
          name: newItemName,
          price: parseFloat(newItemPrice),
        });
        break;
      case Tab.Product:
        await createProduct(newProductData);
        break;
    }
  };

  const handleUpdateItem = async () => {
    if (!editingItem) return;
    switch (activeTab) {
      case Tab.Category:
        await updateCategory(editingItem.documentId, { name: newItemName });
        break;
      case Tab.Subcategory:
        await updateSubcategory(editingItem.documentId, { name: newItemName });
        break;
      case Tab.QuickNote:
        await updateQuickNote(editingItem.documentId, { name: newItemName });
        break;
      case Tab.Extra:
        await updateExtra(editingItem.documentId, {
          name: newItemName,
          price: parseFloat(newItemPrice),
        });
        break;
      case Tab.Product:
        await updateProduct(editingItem.documentId, newProductData);
        break;
    }
  };

  const handleDeleteItem = async (
    item:
      | CategoryData
      | SubcategoryData
      | QuickNoteData
      | ExtraData
      | ProductData,
  ) => {
    switch (activeTab) {
      case Tab.Category:
        await deleteCategory(item.documentId);
        break;
      case Tab.Subcategory:
        await deleteSubcategory(item.documentId);
        break;
      case Tab.QuickNote:
        await deleteQuickNote(item.documentId);
        break;
      case Tab.Extra:
        await deleteExtra(item.documentId);
        break;
      case Tab.Product:
        await deleteProduct(item.documentId);
        break;
    }
  };

  const handleCreate = async () => {
    try {
      await handleCreateItem();
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
      await handleUpdateItem();
      resetForm();
      setIsDialogOpen(false);
      onUpdate();
    } catch (error) {
      throw new Error((error as Error).message);
    }
  };

  const renderItems = (
    items: (
      | CategoryData
      | SubcategoryData
      | QuickNoteData
      | ExtraData
      | ProductData
    )[],
  ) => {
    return items.map((item) => (
      <Card key={item.id} className="mb-2">
        <CardContent className="flex justify-between items-center p-4">
          <span>
            {item.name}
            {"price" in item && ` - ${item.price.toFixed(2)} €`}
          </span>
          <div className="flex space-x-2">
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
                  activeTab === Tab.Product &&
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
              onClick={() => handleDeleteItem(item)}
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
          value={newProductData.price.toString()}
          onChange={(e) =>
            setNewProductData({
              ...newProductData,
              price: parseFloat(e.target.value),
            })
          }
          className="col-span-3"
        />
      </div>
    </div>
  );

  return (
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="block md:hidden">
          <Select value={activeTab} onValueChange={setActiveTab}>
            <SelectTrigger className="w-full font-bold">
              <SelectValue placeholder="Seleccionar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="product">Productos</SelectItem>
              <SelectItem value="extra">Extras</SelectItem>
              <SelectItem value="quickNote">Notas rápidas</SelectItem>
              <SelectItem value="category">Categorias</SelectItem>
              <SelectItem value="subcategory">Subcategorias</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <TabsList className="hidden md:grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          <TabsTrigger value="product">Productos</TabsTrigger>
          <TabsTrigger value="extra">Extras</TabsTrigger>
          <TabsTrigger value="quickNote">Notas rápidas</TabsTrigger>
          <TabsTrigger value="category">Categorias</TabsTrigger>
          <TabsTrigger value="subcategory">Subcategorias</TabsTrigger>
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
          <Button className="mt-4 w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Añadir{" "}
            {activeTab === "category"
              ? "Categoría"
              : activeTab === "subcategory"
                ? "Subcategoría"
                : activeTab === "quickNote"
                  ? "Nota rápida"
                  : activeTab === "extra"
                    ? "Extra"
                    : "Producto"}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Editar" : "Añadir"}{" "}
              {activeTab === "category"
                ? "Categoría"
                : activeTab === "subcategory"
                  ? "Subcategoría"
                  : activeTab === "quickNote"
                    ? "Nota rápida"
                    : activeTab === "extra"
                      ? "Extra"
                      : "Producto"}
            </DialogTitle>
          </DialogHeader>
          {activeTab === "product" ? (
            renderProductForm()
          ) : (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="sm:text-right">
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
                <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                  <Label htmlFor="price" className="sm:text-right">
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
          <Button
            className="w-full sm:w-auto"
            onClick={editingItem ? handleUpdate : handleCreate}
          >
            {editingItem ? "Actualizar" : "Crear"}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
