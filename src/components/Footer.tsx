import { Link } from "react-router-dom";
import { FileText, Shield, Car, House, Heart, Bike, CreditCard, Plane, Scale, Cookie } from "lucide-react";
const Footer = () => {
  return <footer className="bg-gray-900 text-white py-12 mt-16">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Services */}
          <div>
            <h4 className="font-semibold mb-4">Nos Services</h4>
            <ul className="space-y-2 text-gray-300">
              <li>
                <Link to="/?type=auto" className="hover:text-white transition-colors flex items-center gap-2">
                  <Car className="w-4 h-4" />
                  Assurance Auto
                </Link>
              </li>
              <li>
                <Link to="/?type=habitation" className="hover:text-white transition-colors flex items-center gap-2">
                  <House className="w-4 h-4" />
                  Assurance Habitation
                </Link>
              </li>
              <li>
                <Link to="/?type=sante" className="hover:text-white transition-colors flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  Assurance Santé
                </Link>
              </li>
              <li>
                <Link to="/?type=moto" className="hover:text-white transition-colors flex items-center gap-2">
                  <Bike className="w-4 h-4" />
                  Assurance Moto
                </Link>
              </li>
              <li>
                <Link to="/?type=emprunteur" className="hover:text-white transition-colors flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Assurance Emprunteur
                </Link>
              </li>
              <li>
                <Link to="/?type=voyage" className="hover:text-white transition-colors flex items-center gap-2">
                  <Plane className="w-4 h-4" />
                  Assurance Voyage
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4">Informations légales</h4>
            <ul className="space-y-2 text-gray-300">
              <li>
                <Link to="/terms" className="hover:text-white transition-colors flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Conditions d'utilisation
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-white transition-colors flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Confidentialité
                </Link>
              </li>
              <li>
                <Link to="/legal" className="hover:text-white transition-colors flex items-center gap-2">
                  <Scale className="w-4 h-4" />
                  Mentions légales
                </Link>
              </li>
              <li>
                <Link to="/cookies" className="hover:text-white transition-colors flex items-center gap-2">
                  <Cookie className="w-4 h-4" />
                  Politique des cookies
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Info */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-gray-900" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">AssuranceIA</h3>
                <p className="text-xs text-gray-300">Votre conseiller digital</p>
              </div>
            </div>
            <p className="text-gray-300 mb-4">
              Votre conseiller assurance intelligent, disponible 24h/24 pour vous accompagner dans tous vos projets d'assurance.
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        
      </div>
    </footer>;
};
export default Footer;