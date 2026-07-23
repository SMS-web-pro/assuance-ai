
import { CheckCircle, Zap, MessageCircle, Shield, Clock } from "lucide-react";
import { motion } from "framer-motion";

const MobileCTA = () => {
  const features = [
    { icon: Zap, text: "Gratuit et sans engagement" },
    { icon: MessageCircle, text: "Conseils personnalisés" },
    { icon: Shield, text: "Sécurité maximale" },
    { icon: Clock, text: "Devis en 5 minutes" }
  ];

  return (
    <div className="relative overflow-hidden px-4 py-12">
      {/* Fond avec dégradé et effet de vague */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0dGVybiBpZD0icGF0dGVybiIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIiBwYXR0ZXJuVHJhbnNmb3JtPSJyb3RhdGUoNDUpIHNjYWxlKDAuNSkiPjxyZWN0IHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgZmlsbD0iI2ZmZiIgZmlsbC1vcGFjaXR5PSIwLjEiLz48L3BhdHRlcm4+PHJlY3QgZmlsbD0idXJsKCNwYXR0ZXJuKSIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIvPjwvc3ZnPg==')] opacity-30"></div>
      </div>
      
      <div className="relative z-10 max-w-2xl mx-auto">
        <motion.div 
          className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl p-8 shadow-xl overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {/* Éléments décoratifs */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full"></div>
          <div className="absolute -bottom-16 -left-10 w-40 h-40 bg-purple-500/20 rounded-full"></div>
          
          <div className="relative z-10">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm mb-4">
              <Zap className="w-5 h-5 text-yellow-300 mr-2" />
              <span className="text-sm font-medium">Nouveau : Assistant IA</span>
            </div>
            
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Prêt à simplifier votre assurance ?
            </h2>
            
            <p className="text-blue-100 mb-8 max-w-lg mx-auto">
              Découvrez comment notre solution IA peut vous faire économiser temps et argent sur vos assurances.
            </p>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
              {features.map((feature, index) => (
                <motion.div 
                  key={index}
                  className="flex items-center bg-white/10 p-3 rounded-lg backdrop-blur-sm"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 * index }}
                >
                  <feature.icon className="w-5 h-5 text-blue-200 mr-2 flex-shrink-0" />
                  <span className="text-sm font-medium">{feature.text}</span>
                </motion.div>
              ))}
            </div>
            
            <div className="mt-4 text-center">
              <p className="text-sm text-blue-100/80">
                Commencez dès maintenant, c'est simple et rapide
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default MobileCTA;
