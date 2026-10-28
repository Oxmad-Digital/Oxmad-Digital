# Audit de performance — Oxmad Digital

Date : 27 octobre 2026  
Périmètre : vitrine publique, espace client, administration, API, accès PostgreSQL/Neon, médias R2 et chaîne de build.

## Conclusion

Le projet repose sur de bonnes fondations Next.js : la vitrine est précompilée, les espaces authentifiés ont leur propre layout léger, les images passent par `next/image`, les fichiers clients sont envoyés directement vers R2 et les requêtes indépendantes sont souvent parallélisées. Le build de production et TypeScript passent. Aucun décalage visuel n'a été mesuré sur les parcours testés.

Le principal risque est la couche d'expérience de la vitrine. Sur le premier affichage de l'accueil, le navigateur peint rapidement du contenu, mais un rideau plein écran le masque pendant environ **5,22 s sur le profil mobile**. Le JavaScript initial de chaque page publique est également élevé : **249 à 269 Ko compressés**, y compris 249 Ko sur les mentions légales. Enfin, la page Réalisations affiche un **LCP de 3,71 s** sur le profil mobile à cause de son image héro de 270 Ko.

La priorité est donc de supprimer les délais et calculs techniques inutiles, puis de charger progressivement les effets, le lecteur audio, la réservation et les interactions secondaires, sans modifier l'expérience finale.

## Contraintes de correction

Les recommandations de cet audit doivent respecter les invariants suivants :

- aucune animation existante n'est supprimée, raccourcie ou simplifiée pour gagner un score ;
- le rendu, le rythme des transitions et le comportement des interactions restent identiques ;
- aucune image n'est dégradée : un format ou un encodage plus léger n'est accepté qu'après validation visuelle aux DPR et dimensions réellement servis ;
- une fonctionnalité différée est préchargée assez tôt pour être disponible sans délai perceptible au clic, au focus ou à son entrée dans le viewport ;
- chaque optimisation est livrée avec une comparaison avant/après et peut être annulée indépendamment.

Les gains visés viennent du découpage des bundles, du préchargement, de la suppression des réencodages plus lourds que les sources, du cache, des index SQL et de la suspension du travail invisible. Les effets visibles restent présents.

## Optimisations appliquées et validées — 28 octobre 2026

Le lot d'optimisations structurelles a été appliqué. Il ne supprime aucune animation, ne modifie aucun timing d'animation, ne retire aucune fonctionnalité et ne baisse aucun réglage de qualité d'image.

### Gains déterministes sur le chargement initial

Les poids ci-dessous sont calculés avec la même méthode avant/après : somme gzip des fichiers référencés directement par le HTML de production.

| Route | JavaScript avant | JavaScript après | Gain | CSS avant | CSS après | Gain |
|---|---:|---:|---:|---:|---:|---:|
| `/` | 269 248 o | 254 073 o | −15 175 o (−5,6 %) | 14 004 o | 10 235 o | −3 769 o (−26,9 %) |
| `/realisations` | 261 705 o | 195 206 o | −66 499 o (−25,4 %) | 14 197 o | 10 419 o | −3 778 o (−26,6 %) |
| `/mentions-legales` | 249 312 o | 182 780 o | −66 532 o (−26,7 %) | 7 391 o | 3 613 o | −3 778 o (−51,1 %) |

Ces gains viennent du chargement différé des contrôleurs invisibles de mouvement, du lecteur audio et de la réservation, pas de leur suppression. Le curseur, les transitions, Lenis, le scanner GSAP, le lecteur et la modale de réservation sont toujours montés et ont été testés après hydratation.

### Images sans perte de qualité

Sur mobile, l'image héro de l'accueil est maintenant servie depuis le fichier WebP préparé de 760 px, sans agrandissement à 1200 px ni second réencodage par Next.js. Le transfert passe de 200 926 à 174 426 octets, soit 26 500 octets évités. Le logo d'introduction réutilise en plus la ressource déjà demandée par l'en-tête au lieu de télécharger une seconde variante de 36 652 octets. Le gain cumulé à cache froid est donc de 63 152 octets.

Aucun paramètre `quality` n'a été abaissé. Le fichier préparé devient la référence rendue directement : il ne subit plus la perte induite par un redimensionnement et un réencodage supplémentaires. Les deux captures 1170 × 2532 donnent un PSNR de 47,67 dB entre la source directe et l'ancien réencodage ; seulement 0,1445 % des canaux diffèrent de plus de cinq niveaux. La version directe a été retenue parce qu'elle préserve exactement la source existante tout en transférant moins de données.

La page Réalisations dispose maintenant d'un cadrage mobile 4:3 préparé à 1170 × 878, soit le DPR 3 d'un viewport de 390 px. Il remplace sur mobile la variante Next.js de 269 582 octets par un AVIF de 214 642 octets : 54 940 octets évités (−20,4 %). L'ancien rendu ne conservait qu'environ 900 × 675 pixels utiles après son recadrage CSS ; la nouvelle ressource contient donc davantage de détail affiché malgré son poids inférieur. Une comparaison côte à côte avec le cadrage de référence a été validée avant intégration.

### Corrections techniques livrées

- les utilitaires canvas purs ont été séparés du module GSAP afin qu'un simple dessin de canvas n'importe plus le moteur d'animation ;
- la modale de réservation est chargée à la demande et préchargée dès l'ouverture du contact, au survol/focus du lien ou à l'entrée du jeu dans le viewport ;
- les contrôleurs de mouvement globaux sont placés dans des chunks séparés, tout en restant actifs sur toutes les pages où ils existaient ;
- le lecteur audio inchangé est monté après l'hydratation dans son propre chunk ; sa position fixe évite tout décalage de mise en page et son ouverture a été testée ;
- le ticker Lenis est suspendu uniquement lorsque le document est masqué, puis reprend avec la même instance et le même état ;
- Lenis retire désormais aussi son callback du ticker lorsqu'il a atteint sa cible et le réinstalle au prochain geste ou scroll programmatique. Le test compte zéro frame Lenis pendant une seconde au repos, puis valide son réveil ;
- l'effet de graisse variable du titre de contact utilise une boucle `requestAnimationFrame` qui s'endort dès que les lettres sont stabilisées, et le clignotement CSS du jeu est mis en pause hors viewport ;
- l'héro mobile et le logo d'introduction évitent les réencodages et téléchargements redondants ;
- l'introduction ne dépend plus du chargement des polices ou de l'image héro avant de poursuivre. Sa chorégraphie GSAP reste strictement de 0,9 s + 1,55 s ; selon les deux validations locales, la navigation complète a retiré la classe `intro` entre 2,89 et 3,09 s ;
- les trois Core Web Vitals réels (LCP, INP et CLS) sont envoyés sans cookie après le chargement, dans un chunk idle de 3,3 Ko gzip. Leurs p75 et nombres d'échantillons sont visibles dans le tableau de bord admin ;
- les index SQL nécessaires aux chemins identifiés sont déclarés dans `db/schema.sql` et ont été appliqués à la base Neon de développement le 28 octobre 2026. Le catalogue PostgreSQL confirme que les sept nouveaux index sont présents, prêts et valides ;
- le build Next utilise l'API du compilateur TypeScript 5 prévue par la documentation de Next 16, ce qui contourne la perte de sortie du vérificateur CLI expérimental sous Node 24 sans désactiver le contrôle de types.

### Contrôles de non-régression

Le script `verify-optimized.cjs` passe entièrement sous Chromium 155. Il vérifie l'introduction et sa durée minimale, le dessin effectif de la transition canvas pendant une vraie navigation interne, Lenis/GSAP, l'endormissement puis le réveil du scroll doux, le curseur sur ordinateur et son absence attendue sur tactile, l'accordéon, le lecteur audio, le dialogue de contact, la réservation chargée à la demande, la sélection de l'héro mobile Réalisations, ainsi que les mouvements sur Réalisations et Mentions légales. Résultat : zéro erreur navigateur et tous les contrôles à `true`.

Le build de production, TypeScript et ESLint passent. ESLint conserve uniquement les deux avertissements déjà recensés sur les petits logos en `<img>`. La série `measurements-final.json` a terminé tous les scénarios avec zéro erreur, zéro requête échouée et un CLS nul. Ses chronos CPU/FCP/LCP ne sont cependant pas utilisés pour conclure : la charge CPU de l'hôte différait matériellement de la référence. Les réductions de poids, elles, proviennent directement des artefacts du même build et restent comparables.

## Méthode

Mesures effectuées sur un build Next.js 16.3.5 en mode production, avec Chromium 155 et cache navigateur froid. Le serveur local était déjà chaud afin d'isoler le coût du navigateur et des ressources. Le profil mobile utilise un viewport 390 × 844, un DPR de 3, un CPU ralenti ×4, 150 ms de latence, 1,6 Mbit/s descendant et 750 Kbit/s montant. Les requêtes `POST` ont été bloquées : aucun formulaire, score ou événement d'analytics n'a été écrit.

Les valeurs sont des mesures de laboratoire locales. Elles servent à comparer les choix du projet, mais ne remplacent ni Lighthouse sur l'URL de production, ni les données réelles des visiteurs. Les routes authentifiées et les requêtes Neon ont été inspectées statiquement ; elles n'ont pas été chargées avec des volumes de production.

## Résultats mesurés

| Parcours | FCP | LCP navigateur | TBT sur 10 s | CLS | Remarque |
|---|---:|---:|---:|---:|---|
| Accueil, mobile, première visite — médiane de 3 | 676 ms | 676 ms | 256 ms | 0 | contenu réellement dévoilé à 5,22 s |
| Accueil, ordinateur, première visite — médiane de 3 | 160 ms | 160 ms | 8 ms | 0 | contenu dévoilé à 2,71 s |
| Accueil, mobile, visite suivante | 672 ms | 672 ms | 296 ms | 0 | rideau absent |
| Accueil, mobile, mouvement réduit | 712 ms | 712 ms | 224 ms | 0 | travail au repos fortement réduit |
| Réalisations, mobile | 848 ms | 3 708 ms | 88 ms | 0 | LCP = image héro de 270 Ko |
| Mentions légales, mobile | 600 ms | 600 ms | 217 ms | 0 | JavaScript global disproportionné |
| Connexion admin, mobile | 520 ms | 520 ms | 130 ms | 0 | layout séparé efficace |
| Connexion client, mobile | 568 ms | 568 ms | 213 ms | 0 | layout séparé efficace |

Le LCP de l'accueil est trompeur : Chromium retient un paragraphe peint derrière le rideau. Le visiteur ne peut voir et utiliser la page qu'après la disparition de la classe `intro`, mesurée à 5,22 s sur mobile.

### Poids initial par route

| Route | HTML gzip | JavaScript gzip | CSS gzip | Cache HTML |
|---|---:|---:|---:|---|
| `/` | 16,9 Ko | 269,2 Ko | 14,0 Ko | `s-maxage=31536000` |
| `/realisations` | 10,1 Ko | 261,7 Ko | 14,2 Ko | `s-maxage=31536000` |
| `/mentions-legales` | 7,1 Ko | 249,3 Ko | 7,4 Ko | `s-maxage=31536000` |
| `/admin/login` | 2,8 Ko | 175,7 Ko | 6,1 Ko | privé, sans cache |
| `/espace-client/connexion` | 3,3 Ko | 183,4 Ko | 6,5 Ko | privé, sans cache |

Ces totaux additionnent les scripts référencés par le HTML initial. Ils représentent le transfert compressé à cache froid, pas le coût des navigations suivantes.

## Constats prioritaires

### P0 — Le rideau d'introduction retarde artificiellement l'accès à l'accueil

**Statut : traité.** L'attente variable des polices et de l'image a été retirée sans toucher aux 2,45 s de la chorégraphie. Le contrôle final mesure 3,086 s navigation comprise sur l'hôte de test.

Le script de boot ajoute `intro` avant le premier rendu. Le composant attend l'image héro, les polices et au moins 900 ms, puis joue encore environ 1,6 s d'animation. Sous le profil mobile, le rideau est resté présent 5,22 s en médiane. La valeur LCP de 676 ms ne reflète donc pas l'expérience réellement visible.

Action recommandée : conserver intégralement le rideau, son dessin pixelisé et sa chorégraphie, mais supprimer l'attente technique qui s'ajoute à la durée créée par le design. Précharger les deux petites ressources nécessaires, démarrer le canvas dès le premier frame utile et ne plus faire dépendre le départ de toute la police ou du décodage tardif de l'image héro. La séquence conserve ses timings écrits ; seule l'attente variable avant et pendant son démarrage disparaît.

Critère : même capture et même chronologie d'animation à tolérance d'une frame, premier frame du rideau en moins de 300 ms et dévoilement complet en moins de 3 s sur le profil mobile, soit la durée intentionnelle déjà observée sur ordinateur plutôt que les 5,22 s dus au chargement.

### P0 — Le layout public hydrate trop de fonctions sur toutes les pages

**Statut : traité pour les éléments sans risque visuel.** Réservation, contrôleurs de mouvement, télémétrie et lecteur audio sont découpés et différés. Les composants visibles et leurs comportements restent identiques.

Le layout public charge immédiatement le curseur personnalisé, les transitions, Lenis, le scanner GSAP, le lecteur audio, l'analytics et le provider de réservation. `lib/motion.ts` importe et enregistre GSAP, ScrollTrigger, SplitText et ScrambleText dès qu'un consommateur importe les utilitaires. Le formulaire de réservation est aussi importé dès le layout même lorsqu'il reste fermé.

Conséquence : même les mentions légales reçoivent 249 Ko de JavaScript compressé. Deux chunks de la vitrine contiennent les outils GSAP/Lenis, et le lecteur audio est présent avant toute intention d'écoute.

Actions recommandées :

1. Séparer les utilitaires sans dépendance de `lib/motion.ts` des modules GSAP.
2. Charger le formulaire de réservation au premier clic, avec préchargement au survol ou au focus du bouton.
3. Charger le lecteur audio et son moteur à l'ouverture du lecteur.
4. Réserver Lenis, le curseur et les transitions aux appareils/pages qui les utilisent réellement.
5. Ne monter les animations spécifiques qu'au niveau de la page concernée.

Critère : moins de 170 Ko gzip de JavaScript initial sur l'accueil et moins de 100 Ko sur les mentions légales, sans perte fonctionnelle.

### P0 — L'image héro de Réalisations domine le LCP mobile

**Statut : traité.** La nouvelle composition mobile économise 20,4 % de transfert et fournit davantage de pixels utiles au cadrage affiché ; la version bureau reste inchangée.

La page ne possède qu'une image héro 1672 × 941, demandée avec `sizes="100vw"` et une qualité de 92. Sur le profil mobile, Next.js a livré une variante de 1200 px pesant 269,6 Ko ; elle est devenue le LCP à 3,71 s.

Un réencodage local à qualité 75 pèse 237,5 Ko contre 392,8 Ko pour le fichier source. L'accueil présente le même signal : sa variante mobile livrée à qualité 92 pèse 200,9 Ko, tandis qu'un encodage local à qualité 75 pèse 110,5 Ko. La qualité 92 réencode parfois un WebP plus lourd que le fichier d'origine.

Actions recommandées : fournir une composition mobile dédiée à Réalisations et conserver `fetchPriority="high"`. Pour l'accueil, éviter que Next.js agrandisse puis réencode à 1200 px une source mobile de 760 px : si le fichier préparé est plus petit et au moins aussi fidèle, il peut être servi directement. Pour chaque héro, comparer WebP et AVIF aux dimensions exactes d'affichage ; une variante n'est retenue que si une revue côte à côte et une mesure perceptuelle confirment une qualité au moins équivalente. Le nombre `quality` n'est pas abaissé à l'aveugle.

Critère : aucune différence perceptible sur les viewports et DPR de référence, image LCP mobile inférieure à 180 Ko si cette parité est atteignable, et LCP de Réalisations inférieur à 2,5 s. Si la parité échoue, la source actuelle est conservée et le gain est cherché dans le cache, le préchargement et le chemin réseau.

### P1 — Des animations entretiennent une activité CPU après le chargement

**Statut : traité.** Les boucles s'endorment hors activité ou hors viewport sans changer leur rendu ; le test déterministe compte zéro appel à `lenis.raf` pendant une seconde au repos et valide ensuite son réveil.

Sur l'accueil mobile de retour, 486 ms de temps de tâche ont été consommées pendant une fenêtre de 2 s au repos. Avec `prefers-reduced-motion`, cette valeur tombe à 40 ms. Un diagnostic séparé mesure 225 ms/2 s par défaut, 144 ms avec les animations CSS mises en pause, puis 93 ms après destruction de Lenis. Ce test ne quantifie pas directement la batterie, mais il confirme une activité continue évitable.

Actions recommandées : conserver Lenis, GSAP et toutes les animations, mais endormir leurs tickers lorsqu'aucune interpolation n'est active, suspendre les boucles lorsque la page est masquée ou la section hors écran, et reprendre exactement au même état lorsque l'élément redevient visible. Les animations CSS infinies peuvent être mises en pause hors viewport. Conserver les mécanismes déjà présents dans le mini-jeu et WebGL, qui appliquent déjà ce principe.

Critère : moins de 50 ms de temps de tâche sur 2 s au repos sur mobile.

### P1 — Les requêtes SQL fonctionneront aujourd'hui, mais certains chemins se dégraderont avec le volume

**Statut : index appliqués sur la base de développement.** Les sept index ajoutés sont présents et valides. Les optimisations de rollup et de cache restent à décider avec des volumes représentatifs, car les appliquer sans données réelles serait prématuré.

Points à surveiller :

- le beacon de durée recherche la dernière vue par `(visitor, path, id)` alors que seul `created_at` est indexé ;
- le classement regroupe par `lower(name)` et calcule `count/sum` sur toutes les parties à chaque lecture ; l'index actuel porte seulement sur `score` ;
- `client_users.client_id`, `client_projects.client_id`, `client_login_tokens.expires_at`, `drive_folders(client_id, parent_id)` et les pièces jointes par `request_id` n'ont pas d'index dédié ;
- le tableau de bord lance le rollup puis neuf requêtes analytiques à chaque ouverture ; le volume brut est limité à la journée, ce qui évite une croissance sans borne, mais crée un pic de travail lors des premières visites admin ;
- l'insertion de 20 fichiers maximum effectue les insertions SQL une par une.

Actions recommandées : vérifier les plans avec `EXPLAIN (ANALYZE, BUFFERS)` sur une copie représentative, puis ajouter les index composites manquants. Maintenir les totaux du jeu de façon incrémentale ou les mettre en cache ; déplacer le rollup analytics dans une tâche planifiée ou ne l'exécuter qu'une fois par période ; grouper les insertions de fichiers en une requête atomique.

Critère : p95 inférieur à 300 ms pour `/api/game`, les listes du portail et le tableau de bord avec les volumes cibles.

### P1 — Les pages dynamiques n'ont pas de frontière de chargement

Aucun `loading.tsx` n'est présent. Les pages du portail effectuent correctement plusieurs requêtes en parallèle, mais une latence Neon froide bloque encore l'affichage complet pendant la navigation.

Action recommandée : ajouter des états de chargement aux layouts admin/client et, pour les écrans lourds, des frontières `Suspense` autour des blocs indépendants.

### P2 — Il manque la mesure des Core Web Vitals réels

**Statut : traité.** LCP, INP et CLS sont maintenant collectés sans identifiant visiteur et exposés en p75 dans l'administration. La conclusion terrain demandera naturellement du trafic réel après déploiement.

L'analytics maison suit les vues et le temps visible, mais pas LCP, INP, CLS ni TTFB. Les résultats de laboratoire ne montrent ni les appareils malgaches réels, ni les caches CDN, ni les latences R2/Neon de production.

Action recommandée : envoyer un échantillon de `useReportWebVitals` vers un endpoint agrégé, sans identifiant personnel, en conservant la route, le type d'appareil et la version du déploiement. Définir des alertes p75 : LCP ≤ 2,5 s, INP ≤ 200 ms, CLS ≤ 0,1.

### P2 — Dépendances et qualité de build

`googleapis` est déclaré mais aucune utilisation n'a été trouvée dans les sources actives ; son installation occupe environ 204 Mo dans `node_modules`. Le supprimer si l'intégration Google Calendar a réellement disparu accélérera surtout les installations et la CI. Les versions de `next` (16.3.5) et `eslint-config-next` (16.1.6) devraient aussi être alignées.

ESLint ne remonte aucune erreur et seulement deux avertissements sur les logos en `<img>`. Ils ont peu d'impact s'ils restent de petits SVG/WebP, mais peuvent être convertis en `Image` avec dimensions explicites pour homogénéiser la stratégie.

## Points solides à préserver

- `/`, `/realisations` et `/mentions-legales` sont statiques et portent un cache CDN longue durée.
- Les layouts admin/client évitent le chrome, l'audio, les animations et l'analytics de la vitrine.
- Le build de production compile en 1,6 s, TypeScript finit en 3,1 s et les 25 pages sont générées sans erreur.
- Aucun CLS n'a été mesuré sur les huit scénarios.
- Geist est auto-hébergée par `next/font` ; la police testée représente environ 29,6 Ko transférés.
- Les médias publics sont servis depuis R2 avec des noms versionnés et un cache immutable d'un an.
- Les 22 médias du manifeste passent de 11,6 Mo de sources à 2,39 Mo préparés au total.
- Le mini-jeu et WebGL suspendent déjà leurs boucles hors écran ; les images de services ne sont demandées qu'au premier survol.
- Les fichiers privés sont envoyés directement au bucket et les requêtes indépendantes du portail sont parallélisées.

## Ordre de mise en œuvre conseillé

1. Stabiliser le démarrage de l'introduction, sans changer sa chorégraphie, et optimiser le transport des deux images héro avec validation de fidélité.
2. Découper le JavaScript du layout public, en commençant par réservation, audio, GSAP et Lenis.
3. Réduire l'activité CPU au repos et refaire les mêmes scénarios de mesure.
4. Ajouter la télémétrie Web Vitals, puis valider les p75 en production pendant au moins deux semaines.
5. Auditer les plans SQL avec des volumes représentatifs et appliquer les index/caches requis.
6. Ajouter les frontières de chargement et nettoyer les dépendances de build.

## Garde-fous avant livraison d'une correction

Chaque lot devra passer les contrôles suivants avant intégration :

1. captures comparatives aux largeurs 390, 760, 1024 et 1440 px, avec DPR 1, 2 et 3 pour les héros ;
2. comparaison des états clés de chaque animation et de leur durée, avec une tolérance maximale d'une frame ;
3. comparaison perceptuelle des images et revue humaine côte à côte ; aucune variante dégradée n'est retenue ;
4. tests clavier, tactile, souris, mouvement réduit et ouverture immédiate des fonctions chargées à la demande ;
5. nouvelle mesure avec le même protocole, puis conservation de la correction uniquement si elle produit un gain mesurable sans régression visuelle ou fonctionnelle.

## Artefacts

- `measurements.json` : mesures brutes par scénario et inventaire des ressources.
- `diagnostic.json` : isolation du coût CPU et mesure d'une interaction d'accordéon.
- `image-experiment.json` : comparaison locale des qualités WebP.
- `build.log` et `lint.log` : sorties des contrôles.
- `measure.cjs` et `diagnose.cjs` : scripts de reproduction en production locale.
- `home-mobile.png` : capture du profil mobile de diagnostic.

