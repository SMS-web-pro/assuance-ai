import { MessageCircle, Clock, Shield, Zap, CheckCircle, Users, ShieldCheck, ChevronRight, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

// Import des composants
import MobileHeroSection from "./MobileHeroSection";
import MobileFeatureCard from "./MobileFeatureCard";
import MobileServiceCard from "./MobileServiceCard";
import MobileStepCard from "./MobileStepCard";
import MobileCTA from "./MobileCTA";

const MobileHomePage = () => {
  const features = [
    {
      icon: Zap,
      title: "Rapide et Efficace",
      description: "Obtenez des réponses instantanées et des devis personnalisés en quelques secondes.",
      color: "bg-blue-500"
    },
    {
      icon: CheckCircle,
      title: "Expertise IA",
      description: "Nos algorithmes avancés analysent vos besoins pour vous proposer les meilleures solutions.",
      color: "bg-green-500"
    },
    {
      icon: ShieldCheck,
      title: "Sécurité Maximale",
      description: "Vos données sont cryptées et protégées selon les normes les plus strictes du secteur.",
      color: "bg-purple-500"
    },
    {
      icon: Users,
      title: "Support Humain",
      description: "Notre équipe d'experts est là pour vous accompagner à tout moment.",
      color: "bg-red-500"
    }
  ];

  const services = [
    { 
      title: "Assurance Auto", 
      description: "Protection complète pour votre véhicule avec des garanties adaptées à vos besoins.", 
      color: "blue-50 border-blue-200",
      icon: "🚗"
    },
    { 
      title: "Assurance Habitation", 
      description: "Sécurisez votre logement et vos biens contre tous les risques.", 
      color: "green-50 border-green-200",
      icon: "🏠"
    },
    { 
      title: "Assurance Santé", 
      description: "Complémentaire santé personnalisée pour vous et votre famille.", 
      color: "red-50 border-red-200",
      icon: "🏥"
    },
    { 
      title: "Assurance Moto", 
      description: "Protection complète pour votre deux-roues, avec assistance 24/7.", 
      color: "orange-50 border-orange-200",
      icon: "🏍️"
    },
    { 
      title: "Assurance Emprunteur", 
      description: "Sécurisez votre crédit immobilier en toutes circonstances.", 
      color: "purple-50 border-purple-200",
      icon: "🏦"
    },
    { 
      title: "Assurance Voyage", 
      description: "Voyagez l'esprit tranquille avec une couverture complète à l'étranger.", 
      color: "teal-50 border-teal-200",
      icon: "✈️"
    }
  ];

  const steps = [
    { 
      step: "1", 
      title: "Choisissez", 
      description: "Sélectionnez le type d'assurance qui correspond à vos besoins.",
      icon: "📱"
    },
    { 
      step: "2", 
      title: "Discutez avec l'IA", 
      description: "Notre assistant IA vous guide et répond à toutes vos questions en temps réel.",
      icon: "💬"
    },
    { 
      step: "3", 
      title: "Personnalisez", 
      description: "Ajustez les garanties selon vos besoins spécifiques et votre budget.",
      icon: "⚙️"
    },
    { 
      step: "4", 
      title: "Obtenez votre devis", 
      description: "Recevez instantanément votre devis personnalisé et souscrivez en ligne.",
      icon: "✅"
    }
  ];

  const aiAgents = [
    { 
      name: "Auto", 
      icon: "🚗", 
      type: "auto",
      gradient: "from-blue-500 to-blue-600",
      description: "Devis véhicule instantané"
    },
    { 
      name: "Habitation", 
      icon: "🏠", 
      type: "habitation",
      gradient: "from-green-500 to-green-600",
      description: "Protection logement"
    },
    { 
      name: "Santé", 
      icon: "🏥", 
      type: "sante",
      gradient: "from-red-500 to-red-600",
      description: "Mutuelle personnalisée"
    },
    { 
      name: "Moto", 
      icon: "🏍️", 
      type: "moto",
      gradient: "from-orange-500 to-orange-600",
      description: "Deux-roues sécurisé"
    },
    { 
      name: "Emprunteur", 
      icon: "🏦", 
      type: "emprunteur",
      gradient: "from-purple-500 to-purple-600",
      description: "Crédit protégé"
    },
    { 
      name: "Voyage", 
      icon: "✈️", 
      type: "voyage",
      gradient: "from-teal-500 to-teal-600",
      description: "Sérénité voyage"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <MobileHeroSection 
          title="Votre Conseiller Assurance IA"
          description="Découvrez une nouvelle façon d'obtenir vos devis d'assurance grâce à l'IA. Rapide, personnalisé et disponible 24h/24."
        />
      </motion.div>

      {/* Features Section */}
      <motion.div 
        className="px-4 py-8"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.5 }}
      >
        <div className="grid grid-cols-1 gap-4 mb-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ 
                opacity: 1, 
                y: 0,
                transition: { delay: index * 0.1 }
              }}
              viewport={{ once: true, margin: "-20px" }}
            >
              <MobileFeatureCard
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                color={feature.color}
              />
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* AI Agents Section */}
      <motion.div
        className="px-4 py-8"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.5 }}
      >
        <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-xl p-5 shadow-lg mb-6 border border-blue-100">
          <div className="text-center mb-5">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              🤖 Agents IA Spécialisés
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              Choisissez votre expert et lancez votre conversation
            </p>
            <div className="w-12 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto mt-3 rounded-full"></div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {aiAgents.map((agent, index) => (
              <motion.button
                key={index}
                onClick={() => window.location.href = `/prospect?type=${agent.type}`}
                className="group relative bg-white rounded-xl p-4 shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105 border border-gray-100 hover:border-gray-200 active:scale-95"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ 
                  opacity: 1, 
                  y: 0,
                  transition: { delay: index * 0.1 }
                }}
                viewport={{ once: true, margin: "-20px" }}
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${agent.gradient} opacity-0 group-hover:opacity-5 rounded-xl transition-opacity duration-300`}></div>
                <div className="relative z-10">
                  <div className="text-3xl mb-2 group-hover:scale-110 transition-transform duration-300">
                    {agent.icon}
                  </div>
                  <div className="text-sm font-semibold text-gray-800 mb-1 group-hover:text-gray-900">
                    {agent.name}
                  </div>
                  <div className="text-xs text-gray-500 group-hover:text-gray-600">
                    {agent.description}
                  </div>
                </div>
                <div className="absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-blue-200 group-hover:animate-pulse"></div>
              </motion.button>
            ))}
          </div>
          
          <div className="text-center mt-4 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500 flex items-center justify-center">
              <span className="animate-pulse mr-1">💬</span>
              Chat instantané • Devis en temps réel
            </p>
          </div>
        </div>
      </motion.div>

      {/* Voice Chat Feature */}
      <motion.div
        className="px-4 py-8"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.5 }}
      >
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 shadow-lg mb-6">
          <h2 className="text-xl font-bold text-center text-gray-900 mb-4">
            🎤 Parlez avec l'IA
          </h2>
          <div className="space-y-3">
            <div className="bg-white rounded-lg p-3 border border-green-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-lg">🎙️</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-800 text-sm">Reconnaissance vocale</h3>
                  <p className="text-gray-600 text-xs">Parlez naturellement, l'IA vous comprend</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-3 border border-green-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-lg">🔊</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-800 text-sm">Réponse vocale</h3>
                  <p className="text-gray-600 text-xs">L'agent vous répond à voix haute</p>
                </div>
              </div>
            </div>
            
            <div className="text-center mt-3">
              <p className="text-xs text-gray-500">
                💡 Appuyez sur le micro dans le chat pour commencer
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Services Section */}
      <motion.div
        className="px-4 py-8"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.5 }}
      >
        <div className="bg-white rounded-lg p-4 shadow-lg mb-8">
          <h2 className="text-xl font-bold text-center text-gray-900 mb-6">
            Nos Services d'Assurance
          </h2>
          <div className="grid grid-cols-1 gap-4">
            {services.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ 
                  opacity: 1, 
                  y: 0,
                  transition: { delay: index * 0.1 }
                }}
                viewport={{ once: true, margin: "-20px" }}
              >
                <MobileServiceCard
                  title={service.title}
                  description={service.description}
                  color={service.color}
                  icon={service.icon}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* How it works Section */}
      <motion.div
        className="px-4 py-8"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Comment ça fonctionne ?
          </h2>
          <div className="grid grid-cols-1 gap-6">
            {steps.map((step, index) => (
              <MobileStepCard
                key={step.step}
                step={step.step}
                title={step.title}
                description={step.description}
                icon={step.icon}
                index={index}
              />
            ))}
          </div>
        </div>
      </motion.div>

      {/* Call to Action Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.5 }}
      >
        <MobileCTA />
      </motion.div>
    </div>
  );
};

export default MobileHomePage;
