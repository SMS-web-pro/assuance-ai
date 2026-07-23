
import { motion } from "framer-motion";

interface MobileStepCardProps {
  step: string;
  title: string;
  description: string;
  icon?: string;
  index: number;
}

const MobileStepCard = ({ step, title, description, icon = "🔹", index }: MobileStepCardProps) => {
  // Couleurs de dégradé pour chaque étape
  const gradients = [
    "from-blue-500 to-blue-600",
    "from-purple-500 to-purple-600",
    "from-pink-500 to-rose-500",
    "from-teal-500 to-emerald-500"
  ];
  
  const gradient = gradients[parseInt(step) - 1] || gradients[0];

  return (
    <motion.div 
      className="relative flex flex-col items-center text-center px-4 py-6 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ 
        opacity: 1, 
        y: 0,
        transition: { delay: index * 0.1 }
      }}
      viewport={{ once: true, margin: "-50px" }}
      whileHover={{ y: -5 }}
    >
      {/* Numéro d'étape avec dégradé */}
      <div className={`absolute -top-5 w-10 h-10 rounded-xl bg-gradient-to-r ${gradient} flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
        {step}
      </div>
      
      {/* Icône */}
      <div className="text-3xl mb-3 mt-6">
        {icon}
      </div>
      
      <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
      
      {/* Ligne de connexion entre les étapes (sauf pour la dernière) */}
      {index < 3 && (
        <div className="absolute -right-6 top-1/2 transform -translate-y-1/2 w-6 h-1 bg-gradient-to-r from-gray-200 to-gray-100">
          <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse"></div>
        </div>
      )}
    </motion.div>
  );
};

export default MobileStepCard;
