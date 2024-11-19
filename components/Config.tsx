import React, { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Minus, Plus, Settings } from "lucide-react";
import {
  CategoryData,
  SubcategoryData,
  QuickNoteData,
  ExtraData,
  ProductData,
  TableData,
} from "@/lib/strapi";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ManageRecords from "@/components/ManageRecords";

interface ConfigProps {
  isSettingsOpen: boolean;
  setIsSettingsOpen: (isOpen: boolean) => void;
  config: {
    disableNotifications: boolean;
    notificationDuration: number;
    theme: "light" | "dark";
  };
  setConfig: React.Dispatch<React.SetStateAction<ConfigProps["config"]>>;
  tables: TableData[];
  handleAddTable: () => void;
  handleDeleteTable: () => void;
  categories: CategoryData[];
  subcategories: SubcategoryData[];
  quickNotes: QuickNoteData[];
  extras: ExtraData[];
  products: ProductData[];
  onUpdate: () => void;
}

const Config: React.FC<ConfigProps> = ({
  isSettingsOpen,
  setIsSettingsOpen,
  config,
  setConfig,
  tables,
  handleAddTable,
  handleDeleteTable,
  categories,
  subcategories,
  quickNotes,
  extras,
  products,
  onUpdate,
}) => {
  const [activeTab, setActiveTab] = useState("general");

  return (
    <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[90vh] overflow-y-auto auto-rows-min">
        <DialogHeader>
          <DialogTitle>Configuración</DialogTitle>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="manage">Registros</TabsTrigger>
          </TabsList>
          <TabsContent value="general">
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
                    disabled={Boolean(tables[tables.length - 1]?.orders.length)}
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
          </TabsContent>
          <TabsContent value="manage">
            <ManageRecords
              categories={categories}
              subcategories={subcategories}
              quickNotes={quickNotes}
              extras={extras}
              products={products}
              onUpdate={onUpdate}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default Config;
