import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from 'lucide-react';
import { Product } from '@/hooks/useProducts';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  product: Product;
  loading?: boolean;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  product,
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
            Tem certeza que deseja excluir o produto <strong>"{product.nome}"</strong>?
          </p>
          
          {product.variants && product.variants.length > 0 && (
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-sm font-medium mb-1">Este produto possui:</p>
              <ul className="text-sm text-muted-foreground">
                <li>• {product.variants.length} variante{product.variants.length > 1 ? 's' : ''}</li>
                <li>• Todas as variantes e movimentações de estoque serão excluídas</li>
              </ul>
            </div>
          )}

          <p className="text-sm text-destructive font-medium">
            Esta ação não pode ser desfeita!
          </p>

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
              {loading ? 'Excluindo...' : 'Excluir Produto'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};