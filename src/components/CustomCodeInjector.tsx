import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface CustomCode {
  id?: number;
  name?: string;
  code: string;
  location: "head" | "body" | "footer";
}

/**
 * CustomCodeInjector
 * Version simplifiée pour une meilleure compatibilité avec les pixels de suivi
 */
const CustomCodeInjector = () => {
  useEffect(() => {
    const loadAndInjectCodes = async () => {
      try {
        const { data, error } = await supabase
          .from("app_settings")
          .select("value")
          .eq("key", "custom_codes")
          .single();

        if (error) {
          console.error("Erreur Supabase:", error);
          return;
        }

        if (!data?.value) return;

        let codes: CustomCode[] = [];
        try {
          codes = JSON.parse(data.value);
        } catch (e) {
          console.error("Erreur d'analyse JSON:", e);
          return;
        }

        if (!Array.isArray(codes)) return;

        // Traitement de chaque code
        codes.forEach(({ id, code, location }) => {
          if (!code) return;

          try {
            // Créer un élément div pour parser le HTML
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = code;
            
            // Trouver tous les éléments script et noscript
            const scripts = tempDiv.querySelectorAll('script');
            const noscripts = tempDiv.querySelectorAll('noscript');
            
            // Injecter les scripts
            scripts.forEach(script => {
              const newScript = document.createElement('script');
              if (id) newScript.setAttribute('data-custom-id', id.toString());
              
              // Copier tous les attributs
              Array.from(script.attributes).forEach(attr => {
                newScript.setAttribute(attr.name, attr.value);
              });
              
              // Si c'est un script externe avec src
              if (script.src) {
                newScript.async = true;
                newScript.defer = true;
              } else {
                // Pour les scripts inline
                newScript.text = script.textContent || '';
              }
              
              // Insérer au bon endroit
              if (location === 'head') {
                document.head.appendChild(newScript);
              } else if (location === 'body') {
                document.body.prepend(newScript);
              } else {
                document.body.appendChild(newScript);
              }
            });
            
            // Injecter les noscripts
            noscripts.forEach(noscript => {
              const newDiv = document.createElement('div');
              newDiv.innerHTML = noscript.innerHTML;
              
              // Nettoyer les scripts potentiels dans noscript
              const scriptsInNoscript = newDiv.querySelectorAll('script');
              scriptsInNoscript.forEach(script => script.remove());
              
              // Ajouter au body
              document.body.appendChild(newDiv);
            });
            
            // Si pas de balise script/noscript, ajouter le contenu tel quel
            if (scripts.length === 0 && noscripts.length === 0) {
              const container = document.createElement('div');
              if (id) container.setAttribute('data-custom-id', id.toString());
              container.innerHTML = code;
              
              if (location === 'head') {
                document.head.appendChild(container);
              } else if (location === 'body') {
                document.body.prepend(container);
              } else {
                document.body.appendChild(container);
              }
            }
            
          } catch (err) {
            console.error(`Erreur avec le code personnalisé ${id}:`, err);
          }
        });
      } catch (err) {
        console.error("Erreur inattendue:", err);
      }
    };

    loadAndInjectCodes();
  }, []);

  return null;
};

export default CustomCodeInjector;
