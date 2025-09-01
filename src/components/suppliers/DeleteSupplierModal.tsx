import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from 'lucide-react';
import { Supplier } from '@/hooks/useSuppliers';

interface DeleteSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  supplier: Supplier;
  loading?: boolean;
}

export const DeleteSupplierModal: React.FC<DeleteSupplierModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  supplier,
  loading = false
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Confirmar Exclusão
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja excluir o fornecedor <strong>"{supplier.nome}"</strong>?
          </p>
          
          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-sm font-medium mb-1 text-destructive">Atenção:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Esta ação não pode ser desfeita</li>
              <li>• Não será possível excluir se houver produtos vinculados</li>
              <li>• O fornecedor será removido permanentemente do sistema</li>
            </ul>
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={onConfirm}
              disabled={loading}
            >
              {loading ? 'Excluindo...' : 'Excluir Fornecedor'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};