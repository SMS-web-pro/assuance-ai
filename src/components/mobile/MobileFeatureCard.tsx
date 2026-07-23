
import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface MobileFeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
}

const MobileFeatureCard = ({ icon: Icon, title, description, color }: MobileFeatureCardProps) => {
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

  return (
    <motion.div 
      className="h-full"
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <div className="h-full bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300">
        <div className="p-6">
          <div className={`w-14 h-14 rounded-xl bg-gradient-to-r ${gradientClass} flex items-center justify-center mb-4 mx-auto`}>
            <Icon className="w-7 h-7 text-white" />
          </div>
          
          <h3 className="text-xl font-bold text-gray-900 mb-3">
            {title}
          </h3>
          
          <p className="text-gray-600 leading-relaxed">
            {description}
          </p>
          
          <div className="mt-4 flex justify-center">
            <div className="w-8 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
          </div>
        </div>
        
        <div className="px-6 pb-6">
          {/* Contenu supprimé */}
        </div>
      </div>
    </motion.div>
  );
};

export default MobileFeatureCard;
