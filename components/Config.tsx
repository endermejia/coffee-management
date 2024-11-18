import React from "react";

import { Switch } from "@radix-ui/react-switch";
import { Label } from "@radix-ui/react-label";
import { Minus, Plus, Settings } from "lucide-react";
import { TableData } from "@/lib/strapi";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
}

const Config: React.FC<ConfigProps> = ({
  isSettingsOpen,
  setIsSettingsOpen,
  config,
  setConfig,
  tables,
  handleAddTable,
  handleDeleteTable,
}) => {
  return (
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
      </DialogContent>
    </Dialog>
  );
};

export default Config;
