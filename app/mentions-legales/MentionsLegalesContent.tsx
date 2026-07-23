"use client";

import { useLanguage } from "@/components/Language/LanguageContext";

export default function MentionsLegalesContent() {
  const { lang } = useLanguage();

  if (lang === "en") {
    return (
      <section className="ox-legal-page">
        <div className="ox-legal-page-header">
          <h1>Legal notice</h1>
        </div>

        <div className="ox-legal-page-body">
          <article>
            <h2>1. Site publisher</h2>
            <p>
              Company name: <strong>OXMAD DIGITAL</strong>
              <br />
              Legal form: SARLU (single-member limited liability company)
              <br />
              Registered office: 1st floor, Staircase B, Door B104, Immeuble AMPEFILOHA ARO-ANTANANARIVO 101 Madagascar
              <br />
              Tax ID (NIF): 5 019 481 191
              <br />
              STAT: 62011 11 2025 0 11443
              <br />
              RCS: 2025B01419
              <br />
              Phone: +261 38 82 329 33
              <br />
              Email: contact@oxmad-digital.mg
              <br />
              Publication director: Antoine Ponthieu
            </p>
          </article>

          <article>
            <h2>2. Hosting</h2>
            <p>
              The site is designed and hosted by: Framer B.V.
              <br />
              Address: Anthony Fokkerweg 61, 1059 CP Amsterdam, Netherlands
              <br />
              Website: https://www.framer.com
            </p>
          </article>

          <article>
            <h2>3. Intellectual property</h2>
            <p>
              All content on this site (text, original images, photographs, logos, graphic elements, etc.) is the
              exclusive property of OXMAD DIGITAL, unless stated otherwise.
            </p>
            <p>Exceptions:</p>
            <p>
              Some images or graphic resources come from Freepik and are used in accordance with their license
              terms. The copyright of these images belongs to their respective creators.
            </p>
            <p>Some images have been generated using artificial intelligence.</p>
            <p>
              Use of content: any reproduction, representation or distribution, even partial, of content protected by
              OXMAD DIGITAL is prohibited without prior authorization. For images under Freepik license, please refer
              to Freepik's terms of use.
            </p>
          </article>

          <article>
            <h2>4. Terms of use</h2>
            <p>
              Access to and use of the site implies full acceptance of these terms of use. The user agrees to:
            </p>
            <ul>
              <li>Use the site only for legal and personal purposes.</li>
              <li>Not attempt to illegally access the server or disrupt its operation.</li>
              <li>Not collect or use other users' personal data.</li>
            </ul>
            <p>
              The publisher reserves the right to modify the site's content or these terms at any time without
              notice. Users are invited to review them regularly.
            </p>
          </article>

          <article>
            <h2>5. Privacy policy</h2>
            <p>
              Personal data collected (forms, email, phone, cookies) is used solely to process customer requests and
              respond to messages.
            </p>
            <p>It is never sold or shared with third parties without consent.</p>
            <p>
              In accordance with law n°2014-038 on the protection of personal data, every user has a right to access,
              rectify, object to and delete their data.
            </p>
            <p>To exercise these rights, contact: contact@oxmad-digital.mg</p>
          </article>

          <article>
            <h2>6. Cookies</h2>
            <p>
              The site may use cookies to improve navigation, measure audience or save user preferences. Users can
              accept, refuse or delete cookies at any time via their browser settings.
            </p>
          </article>

          <article>
            <h2>7. Liability</h2>
            <p>The publisher makes every effort to ensure the accuracy of the information published.</p>
            <p>
              However, it cannot be held liable for errors, omissions or technical malfunctions, nor for the
              consequences related to the use of the site.
            </p>
          </article>

          <p className="ox-legal-page-updated">Last updated: July 2026</p>
        </div>
      </section>
    );
  }

  return (
    <section className="ox-legal-page">
      <div className="ox-legal-page-header">
        <h1>Mentions légales</h1>
      </div>

      <div className="ox-legal-page-body">
        <article>
          <h2>1. Éditeur du site</h2>
          <p>
            Nom de l&apos;entreprise : <strong>OXMAD DIGITAL</strong>
            <br />
            Forme juridique : SARLU
            <br />
            Siège social : 1er étage, Escalier B, Porte B104, Immeuble AMPEFILOHA ARO-ANTANANARIVO 101 Madagascar
            <br />
            NIF : 5 019 481 191
            <br />
            STAT : 62011 11 2025 0 11443
            <br />
            RCS : 2025B01419
            <br />
            Téléphone : +261 38 82 329 33
            <br />
            Email : contact@oxmad-digital.mg
            <br />
            Directeur de publication : Antoine Ponthieu
          </p>
        </article>

        <article>
          <h2>2. Hébergement</h2>
          <p>
            Le site est conçu et hébergé par : Framer B.V.
            <br />
            Adresse : Anthony Fokkerweg 61, 1059 CP Amsterdam, Pays-Bas
            <br />
            Site web : https://www.framer.com
          </p>
        </article>

        <article>
          <h2>3. Propriété intellectuelle</h2>
          <p>
            L&apos;ensemble des contenus présents sur ce site (textes, images originales, photographies, logos,
            éléments graphiques, etc.) est la propriété exclusive de OXMAD DIGITAL, sauf mention contraire.
          </p>
          <p>Exceptions :</p>
          <p>
            Certaines images ou ressources graphiques proviennent de Freepik et sont utilisées conformément à leur
            licence d&apos;utilisation. Les droits d&apos;auteur de ces images appartiennent à leurs créateurs
            respectifs.
          </p>
          <p>Certaines images ont été générées par intelligence artificielle.</p>
          <p>
            Utilisation des contenus : toute reproduction, représentation ou diffusion, même partielle, des contenus
            protégés par OXMAD DIGITAL est interdite sans autorisation préalable. Pour les images sous licence
            Freepik, veuillez vous référer aux conditions d&apos;utilisation de Freepik.
          </p>
        </article>

        <article>
          <h2>4. Conditions générales d&apos;utilisation (CGU)</h2>
          <p>
            L&apos;accès et l&apos;utilisation du site impliquent l&apos;acceptation pleine et entière des présentes
            CGU. L&apos;utilisateur s&apos;engage à :
          </p>
          <ul>
            <li>Utiliser le site uniquement à des fins légales et personnelles.</li>
            <li>Ne pas tenter d&apos;accéder illégalement au serveur, ni perturber son fonctionnement.</li>
            <li>Ne pas collecter ni utiliser les données personnelles d&apos;autres utilisateurs.</li>
          </ul>
          <p>
            L&apos;éditeur se réserve le droit de modifier le contenu du site ou des CGU à tout moment sans préavis.
            L&apos;utilisateur est invité à les consulter régulièrement.
          </p>
        </article>

        <article>
          <h2>5. Politique de confidentialité</h2>
          <p>
            Les données personnelles collectées (formulaires, email, téléphone, cookies) sont utilisées uniquement
            pour traiter les demandes clients et répondre aux messages.
          </p>
          <p>Elles ne sont jamais vendues ni partagées à des tiers sans consentement.</p>
          <p>
            Conformément à la loi n°2014-038 sur la protection des données à caractère personnel, chaque utilisateur
            dispose d&apos;un droit d&apos;accès, de rectification, d&apos;opposition et de suppression de ses
            données.
          </p>
          <p>Pour exercer ces droits, contactez : contact@oxmad-digital.mg</p>
        </article>

        <article>
          <h2>6. Cookies</h2>
          <p>
            Le site peut utiliser des cookies pour améliorer la navigation, mesurer l&apos;audience ou enregistrer
            les préférences utilisateur. L&apos;utilisateur peut à tout moment accepter, refuser ou supprimer les
            cookies via les paramètres de son navigateur.
          </p>
        </article>

        <article>
          <h2>7. Responsabilité</h2>
          <p>L&apos;éditeur met tout en œuvre pour assurer l&apos;exactitude des informations publiées.</p>
          <p>
            Cependant, il ne saurait être tenu responsable des erreurs, omissions ou dysfonctionnements techniques,
            ni des conséquences liées à l&apos;utilisation du site.
          </p>
        </article>

        <p className="ox-legal-page-updated">Dernière mise à jour : juillet 2026</p>
      </div>
    </section>
  );
}
