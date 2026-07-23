import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import FixedHeader from "@/components/FixedHeader";
import Footer from "@/components/Footer";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gray-100">
      <FixedHeader />
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            Votre Conseiller Assurance IA
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Découvrez une nouvelle façon d'obtenir vos devis d'assurance grâce à l'intelligence artificielle. 
            Rapide, personnalisé et disponible 24h/24.
          </p>
        </div>

        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">404</h1>
          <p className="text-xl text-gray-600 mb-4">Oops! Page not found</p>
        <Link to="/" className="text-blue-500 hover:text-blue-700 underline">
          Return to Home
        </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default NotFound;
