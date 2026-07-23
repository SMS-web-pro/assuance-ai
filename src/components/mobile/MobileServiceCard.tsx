
import { motion } from "framer-motion";

interface MobileServiceCardProps {
  title: string;
  description: string;
  color: string;
  icon?: string;
}

const MobileServiceCard = ({ title, description, color, icon = '✨' }: MobileServiceCardProps) => {
  // Couleurs de dégradé pour chaque type de carte
  const gradientColors = {
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
    purple: "from-purple-500 to-purple-600",
    red: "from-red-500 to-red-600",
    orange: "from-orange-500 to-orange-600",
    teal: "from-teal-500 to-teal-600"
  };

  // Trouver la couleur de dégradé correspondante
  const gradientClass = Object.entries(gradientColors).find(([key]) => 
    color.includes(key)
  )?.[1] || gradientColors.blue;

  // Couleur de fond subtile basée sur la couleur principale
  const bgColor = color.split(' ')[0].replace('bg-', 'bg-opacity-10 bg-');

  return (
    <motion.div 
      className="h-full"
      whileHover={{ y: -5 }}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
    >
      <div className={`h-full rounded-2xl overflow-hidden border border-gray-100 ${bgColor} hover:shadow-lg transition-all duration-300`}>
        <div className="p-6">
          <div className="flex items-start">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${gradientClass} flex items-center justify-center text-2xl text-white mr-4 flex-shrink-0`}>
              {icon}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
            </div>
          </div>
          
          {/* Bouton découverte supprimé */}
        </div>
      </div>
    </motion.div>
  );
};

export default MobileServiceCard;
