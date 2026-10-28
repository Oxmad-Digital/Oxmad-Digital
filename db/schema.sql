-- Oxmad Digital — schéma Neon. Idempotent : `npm run db:setup` peut être relancé sans risque.

CREATE TABLE IF NOT EXISTS contact_messages (
  id          bigserial PRIMARY KEY,
  created_at  timestamptz NOT NULL DEFAULT now(),
  name        text NOT NULL,
  email       text NOT NULL,
  phone       text,
  message     text NOT NULL,
  status      text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'archived'))
);
CREATE INDEX IF NOT EXISTS contact_messages_created_at_idx ON contact_messages (created_at DESC);

CREATE TABLE IF NOT EXISTS bookings (
  id          bigserial PRIMARY KEY,
  created_at  timestamptz NOT NULL DEFAULT now(),
  slot        timestamptz NOT NULL,
  name        text NOT NULL,
  email       text NOT NULL,
  phone       text NOT NULL,
  channel     text NOT NULL,
  message     text,
  status      text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'done', 'cancelled'))
);
CREATE INDEX IF NOT EXISTS bookings_slot_idx ON bookings (slot DESC);

-- Mesure d'audience maison, sans cookie : `visitor` est un hash quotidien (IP + navigateur + sel),
-- impossible à relier d'un jour à l'autre ou à une personne.
CREATE TABLE IF NOT EXISTS page_views (
  id          bigserial PRIMARY KEY,
  created_at  timestamptz NOT NULL DEFAULT now(),
  path        text NOT NULL,
  referrer    text,
  utm_source  text,
  visitor     text NOT NULL,
  country     text,
  device      text,
  browser     text
);
CREATE INDEX IF NOT EXISTS page_views_created_at_idx ON page_views (created_at DESC);
-- Engaged-time beacons update the visitor's latest view of one path.
CREATE INDEX IF NOT EXISTS page_views_visitor_path_idx ON page_views (visitor, path, id DESC);
-- Secondes passées onglet visible sur la page (beacon de sortie). NULL pour les vues antérieures à cette mesure.
ALTER TABLE page_views ADD COLUMN IF NOT EXISTS duration integer;

-- Core Web Vitals réels. L'identifiant est stable pour une mesure : les mises à jour
-- de LCP/INP/CLS remplacent la valeur intermédiaire au lieu de la dupliquer.
CREATE TABLE IF NOT EXISTS web_vitals (
  metric_id       text PRIMARY KEY,
  created_at      timestamptz NOT NULL DEFAULT now(),
  path            text NOT NULL,
  name            varchar(3) NOT NULL CHECK (name IN ('LCP', 'INP', 'CLS')),
  value           double precision NOT NULL,
  rating          varchar(20),
  navigation_type varchar(32),
  device          text
);
CREATE INDEX IF NOT EXISTS web_vitals_path_name_created_idx ON web_vitals (path, name, created_at DESC);

-- Agrégats quotidiens, conservés sans limite. Chaque journée terminée de page_views y est résumée
-- puis supprimée (voir lib/admin-stats.ts) : la base grossit de quelques dizaines de lignes par jour au plus.
-- Le hash visiteur changeant chaque jour, additionner les visiteurs quotidiens donne le même total qu'avant.
CREATE TABLE IF NOT EXISTS page_views_daily (
  day     date NOT NULL,
  path    text NOT NULL,
  source  text NOT NULL DEFAULT '',  -- utm_source, sinon domaine référent, sinon ''
  views   integer NOT NULL,
  PRIMARY KEY (day, path, source)
);

-- Un visiteur (IP + navigateur, sur une journée) a un seul pays / appareil / navigateur : la somme reste exacte.
CREATE TABLE IF NOT EXISTS visitors_daily (
  day       date NOT NULL,
  country   text NOT NULL DEFAULT '',
  device    text NOT NULL,
  browser   text NOT NULL,
  visitors  integer NOT NULL,
  PRIMARY KEY (day, country, device, browser)
);

-- Sessions : vues d'un même visiteur espacées de moins de 30 min d'inactivité. `duration` en secondes cumulées.
CREATE TABLE IF NOT EXISTS sessions_daily (
  day       date PRIMARY KEY,
  sessions  integer NOT NULL,
  duration  bigint NOT NULL
);

-- Comptes de l'espace admin. Mot de passe haché en scrypt (voir lib/password.ts), jamais stocké en clair.
CREATE TABLE IF NOT EXISTS admin_users (
  id             bigserial PRIMARY KEY,
  created_at     timestamptz NOT NULL DEFAULT now(),
  email          text NOT NULL UNIQUE,
  name           text NOT NULL,
  password_hash  text NOT NULL,
  last_login_at  timestamptz
);

-- Double authentification (TOTP, voir lib/totp.ts). `totp_secret` est chiffré (AES-GCM) ; `totp_last_step`
-- empêche de réutiliser un code. Un compte sans 2FA active doit l'activer à sa prochaine connexion.
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS totp_secret text;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS totp_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS totp_last_step bigint;
-- Signe les cookies de session (comme client_users.session_key) : le changer, à la déconnexion par exemple, invalide les sessions du compte.
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS session_key text NOT NULL DEFAULT gen_random_uuid()::text;

-- Codes de secours à usage unique (hachés), pour un téléphone perdu.
CREATE TABLE IF NOT EXISTS admin_backup_codes (
  id         bigserial PRIMARY KEY,
  user_id    bigint NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  code_hash  text NOT NULL,
  used_at    timestamptz,
  UNIQUE (user_id, code_hash)
);

-- ─── Espace client ───────────────────────────────────────────────────────────────────────────────
-- Un client = une entreprise. Ses utilisateurs se connectent par lien magique (pas de mot de passe).
CREATE TABLE IF NOT EXISTS clients (
  id          bigserial PRIMARY KEY,
  created_at  timestamptz NOT NULL DEFAULT now(),
  name        text NOT NULL,
  notes       text
);

-- `session_key` signe les cookies de session : le changer déconnecte toutes les sessions de l'utilisateur.
CREATE TABLE IF NOT EXISTS client_users (
  id             bigserial PRIMARY KEY,
  created_at     timestamptz NOT NULL DEFAULT now(),
  client_id      bigint NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  email          text NOT NULL UNIQUE,
  name           text NOT NULL,
  session_key    text NOT NULL DEFAULT gen_random_uuid()::text,
  last_login_at  timestamptz
);
CREATE INDEX IF NOT EXISTS client_users_client_idx ON client_users (client_id);

-- Liens magiques à usage unique. Seul le hash SHA-256 du jeton est stocké.
CREATE TABLE IF NOT EXISTS client_login_tokens (
  token_hash  text PRIMARY KEY,
  user_id     bigint NOT NULL REFERENCES client_users(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS client_login_tokens_expires_idx ON client_login_tokens (expires_at);

-- Sites / applications d'un client. `maintenance` : le projet est couvert par le contrat de maintenance.
CREATE TABLE IF NOT EXISTS client_projects (
  id           bigserial PRIMARY KEY,
  created_at   timestamptz NOT NULL DEFAULT now(),
  client_id    bigint NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name         text NOT NULL,
  url          text,
  maintenance  boolean NOT NULL DEFAULT true
);
CREATE INDEX IF NOT EXISTS client_projects_client_idx ON client_projects (client_id);

-- Devis et factures : PDF générés ailleurs, déposés depuis l'admin (fichier dans le bucket R2 privé).
CREATE TABLE IF NOT EXISTS client_documents (
  id          bigserial PRIMARY KEY,
  created_at  timestamptz NOT NULL DEFAULT now(),
  client_id   bigint NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  kind        text NOT NULL CHECK (kind IN ('quote', 'invoice')),
  number      text NOT NULL,
  title       text NOT NULL,
  amount      numeric(14, 2),
  currency    text NOT NULL DEFAULT 'EUR',
  issued_on   date NOT NULL,
  due_on      date,
  status      text NOT NULL CHECK (status IN ('pending', 'accepted', 'declined', 'unpaid', 'paid', 'cancelled')),
  file_key    text NOT NULL,
  file_name   text NOT NULL,
  file_size   bigint NOT NULL
);
CREATE INDEX IF NOT EXISTS client_documents_client_idx ON client_documents (client_id, issued_on DESC);

-- Demandes de modification / correction. `last_message_by` : qui a écrit en dernier, pour savoir qui doit répondre.
CREATE TABLE IF NOT EXISTS client_requests (
  id               bigserial PRIMARY KEY,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  client_id        bigint NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  project_id       bigint REFERENCES client_projects(id) ON DELETE SET NULL,
  author_id        bigint REFERENCES client_users(id) ON DELETE SET NULL,
  kind             text NOT NULL CHECK (kind IN ('fix', 'improvement', 'small_feature', 'other')),
  title            text NOT NULL,
  body             text NOT NULL,
  urgent           boolean NOT NULL DEFAULT false,
  status           text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'planned', 'in_progress', 'done', 'out_of_scope', 'cancelled')),
  last_message_by  text NOT NULL DEFAULT 'client' CHECK (last_message_by IN ('client', 'admin'))
);
CREATE INDEX IF NOT EXISTS client_requests_client_idx ON client_requests (client_id, updated_at DESC);
-- Page concernée et résultat attendu : `body` décrit le constat. NULL pour les demandes antérieures à ces champs.
ALTER TABLE client_requests ADD COLUMN IF NOT EXISTS page_url text;
ALTER TABLE client_requests ADD COLUMN IF NOT EXISTS expected text;

-- Fil d'une demande. `system` = changement de statut. Le nom de l'auteur est figé au moment de l'écriture.
CREATE TABLE IF NOT EXISTS client_request_messages (
  id           bigserial PRIMARY KEY,
  created_at   timestamptz NOT NULL DEFAULT now(),
  request_id   bigint NOT NULL REFERENCES client_requests(id) ON DELETE CASCADE,
  author_kind  text NOT NULL CHECK (author_kind IN ('client', 'admin', 'system')),
  author_name  text NOT NULL,
  body         text NOT NULL
);
CREATE INDEX IF NOT EXISTS client_request_messages_request_idx ON client_request_messages (request_id, created_at);

-- Drive : dossiers imbriqués par client, fichiers dans le bucket R2 privé.
-- Un fichier lié à une demande (`request_id`) est une pièce jointe et n'apparaît pas dans le drive.
CREATE TABLE IF NOT EXISTS drive_folders (
  id          bigserial PRIMARY KEY,
  created_at  timestamptz NOT NULL DEFAULT now(),
  client_id   bigint NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  parent_id   bigint REFERENCES drive_folders(id) ON DELETE CASCADE,
  name        text NOT NULL
);
CREATE INDEX IF NOT EXISTS drive_folders_parent_idx ON drive_folders (client_id, parent_id);

CREATE TABLE IF NOT EXISTS client_files (
  id                bigserial PRIMARY KEY,
  created_at        timestamptz NOT NULL DEFAULT now(),
  client_id         bigint NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  folder_id         bigint REFERENCES drive_folders(id) ON DELETE CASCADE,
  request_id        bigint REFERENCES client_requests(id) ON DELETE CASCADE,
  message_id        bigint REFERENCES client_request_messages(id) ON DELETE CASCADE,
  name              text NOT NULL,
  key               text NOT NULL UNIQUE,
  size              bigint NOT NULL,
  content_type      text,
  uploaded_by_kind  text NOT NULL CHECK (uploaded_by_kind IN ('client', 'admin')),
  uploaded_by       text NOT NULL
);
CREATE INDEX IF NOT EXISTS client_files_client_idx ON client_files (client_id, folder_id);
CREATE INDEX IF NOT EXISTS client_files_request_idx ON client_files (request_id, created_at, id) WHERE request_id IS NOT NULL;

-- Parties du mini-jeu 0x-Run, chacune rejouée côté serveur avant d'être acceptée (voir lib/xrun.ts).
-- Toute partie terminée est comptée (statistiques) ; `name` n'est rempli que si le joueur entre au classement.
-- `run` est la signature du jeton de partie : une même partie ne peut être enregistrée qu'une fois.
CREATE TABLE IF NOT EXISTS game_runs (
  id          bigserial PRIMARY KEY,
  created_at  timestamptz NOT NULL DEFAULT now(),
  name        text,
  score       integer NOT NULL,
  ticks       integer NOT NULL,
  run         text NOT NULL UNIQUE
);
CREATE INDEX IF NOT EXISTS game_runs_score_idx ON game_runs (score DESC) WHERE name IS NOT NULL;
CREATE INDEX IF NOT EXISTS game_runs_player_score_idx ON game_runs (lower(name), score DESC, created_at) WHERE name IS NOT NULL;

-- Limitation de débit (voir lib/rate-limit.ts) : un compteur par clé (« route:ip »), fenêtre fixe.
CREATE TABLE IF NOT EXISTS rate_limits (
  key           text PRIMARY KEY,
  window_start  timestamptz NOT NULL DEFAULT now(),
  count         integer NOT NULL DEFAULT 1
);
