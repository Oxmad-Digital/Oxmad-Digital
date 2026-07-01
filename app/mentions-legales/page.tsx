import "./mentions-legales.css";

export default function MentionsLegalesPage() {
  return (
    <section className="mentions-section">
      <div className="mentions-wrapper"> {/* conteneur blanc centré */}
        <div className="mentions-inner">
          <h1>Mentions Légales</h1>

          <div className="mentions-block">
            <div className="mentions-title-wrapper">
              <h2>1. Éditeur du site</h2>
            </div>
            <div className="mentions-content-wrapper">
              <p><strong>Nom de l'entreprise :</strong> Thadéus Externalia</p>
              <p><strong>Forme juridique :</strong> Entreprise Individuelle</p>
              <p><strong>Siège social :</strong> Logement 149, Cité Livaosoa Ambatara
              Antananarivo 101, Madagascar</p>

              <p><strong>Téléphone :</strong> +261 32 17 575 66</p>
              <p><strong>Email :</strong> thadeus@jurisexternalia.com</p>

            </div>
          </div>

          <div className="mentions-block">
            <div className="mentions-title-wrapper">
              <h2>2. Hébergement</h2>
            </div>
            <div className="mentions-content-wrapper">
              <p>Le site est conçu et hébergé par : <strong>Framer B.V.</strong></p>
              <p>Adresse : Anthony Fokkerweg 61, 1059 CP Amsterdam, Pays-Bas</p>
              <p>Site web : <a href="https://www.framer.com" target="_blank" rel="noopener noreferrer">www.framer.com</a></p>
            </div>
          </div>

          <div className="mentions-block">
            <div className="mentions-title-wrapper">
              <h2>3. Propriété intellectuelle</h2>
            </div>
            <div className="mentions-content-wrapper">
              <p>L'ensemble des contenus présents sur ce site (textes, images originales, photographies, logos, éléments graphiques, etc.) est la propriété exclusive de Thadéus Externalia, sauf mention contraire.</p>
              <p><strong>Exceptions :</strong></p>
              <ul>
                <li>Certaines images ou ressources graphiques proviennent de Freepik et sont utilisées conformément à leur licence d'utilisation.</li>
                <li>Certaines images ont été générées par intelligence artificielle.</li>
              </ul>
              <p>Toute reproduction, représentation ou diffusion, même partielle, des contenus protégés est interdite sans autorisation préalable.</p>
            </div>
          </div>

          <div className="mentions-block">
            <div className="mentions-title-wrapper">
              <h2>4. Conditions générales d'utilisation</h2>
            </div>
            <div className="mentions-content-wrapper">
              <p>L'accès et l'utilisation du site impliquent l'acceptation pleine et entière des présentes CGU.</p>
              <p>L'utilisateur s'engage à :</p>
              <ul>
                <li>Utiliser le site uniquement à des fins légales et personnelles.</li>
                <li>Ne pas tenter d'accéder illégalement au serveur, ni perturber son fonctionnement.</li>
                <li>Ne pas collecter ni utiliser les données personnelles d'autres utilisateurs.</li>
              </ul>
            </div>
          </div>

          <div className="mentions-block">
            <div className="mentions-title-wrapper">
              <h2>5. Politique de confidentialité</h2>
            </div>
            <div className="mentions-content-wrapper">
              <p>Les données personnelles collectées (formulaires, email, téléphone, cookies) sont utilisées uniquement pour traiter les demandes clients et répondre aux messages.</p>
              <p>Elles ne sont jamais vendues ni partagées à des tiers sans consentement.</p>
              <p>Pour exercer vos droits : <a href="mailto:thadeus@jurisexternalia.com">thadeus@jurisexternalia.com</a></p>
            </div>
          </div>

          <div className="mentions-block">
            <div className="mentions-title-wrapper">
              <h2>6. Cookies</h2>
            </div>
            <div className="mentions-content-wrapper">
              <p>Le site peut utiliser des cookies pour améliorer la navigation, mesurer l'audience ou enregistrer les préférences utilisateur. L'utilisateur peut à tout moment accepter, refuser ou supprimer les cookies via les paramètres de son navigateur.</p>
            </div>
          </div>

          <div className="mentions-block">
            <div className="mentions-title-wrapper">
              <h2>7. Responsabilité</h2>
            </div>
            <div className="mentions-content-wrapper">
              <p>L'éditeur met tout en œuvre pour assurer l'exactitude des informations publiées. Cependant, il ne saurait être tenu responsable des erreurs, omissions ou dysfonctionnements techniques.</p>
              <p>Ce site a été conçu et développé par <strong>Oxmad Digital</strong>.</p>
            </div>
          </div>

          <p className="mentions-date">Dernière mise à jour : Janvier 2026</p>
        </div>
      </div>
    </section>
  );
}