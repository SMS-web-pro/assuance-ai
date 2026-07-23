
import { useEffect } from 'react';
import { toast } from 'sonner';
import { CheckCircle } from 'lucide-react';

interface DataCollectionNotificationProps {
  isDataComplete: boolean;
  onSave?: () => void;
}

const DataCollectionNotification = ({ isDataComplete, onSave }: DataCollectionNotificationProps) => {
  useEffect(() => {
    if (isDataComplete && onSave) {
      // Afficher une notification avec un bouton pour sauvegarder
      toast.success(
        "Toutes les informations ont été collectées!",
        {
          description: "Cliquez pour sauvegarder la demande dans le système.",
          action: {
            label: "Sauvegarder",
            onClick: onSave
          },
          icon: <CheckCircle className="w-4 h-4" />
        }
      );
    }
  }, [isDataComplete, onSave]);

  return null;
};

export default DataCollectionNotification;
