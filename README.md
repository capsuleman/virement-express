# Virement Express

Exercice de refactoring — durée indicative : **2 heures**.

## Contexte

Nos clients (TPE/PME) utilisent l'endpoint `POST /transfers/batch` pour envoyer plusieurs virements SEPA en une fois, typiquement la paie de leurs salariés ou le règlement de leurs fournisseurs. Chaque virement est transmis à notre partenaire bancaire via son API HTTP. `GET /transfers` liste les virements émis d'un compte.

Ce code tourne en production. L'équipe le trouve difficile à faire évoluer et nous remonte des lenteurs : un lot de paie peut contenir plusieurs centaines de virements, et certains comptes ont des milliers d'opérations.

## Votre mission

Refactorez ce code comme vous le feriez sur une codebase que vous allez maintenir :

- rendez-le lisible, testable et robuste ;
- écrivez les tests que vous jugez nécessaires (l'infrastructure de test est déjà en place, cf. plus bas) ;
- corrigez les problèmes que vous identifiez, en priorisant ce qui vous semble le plus important.

Contraintes :

- **Le contrat HTTP est consommé par le front** : routes, format du body et format des réponses (cf. [Contrat HTTP](#contrat-http)) doivent rester compatibles. Le test existant doit continuer à passer. Vous pouvez faire évoluer les codes HTTP des cas d'erreur si vous le justifiez.
- L'authentification (`src/auth/`) est hors périmètre : le header `x-account-id` identifie le compte appelant.
- Vous n'êtes pas obligé de tout traiter. Mieux vaut peu de choses bien faites et une liste claire du reste.

## Livrable

Un dépôt git (lien GitHub/GitLab ou archive) contenant :

1. votre code, avec un **historique de commits** qui raconte votre démarche (committez souvent) ;
2. une section **« Rendu »** à la fin de ce README avec :
   - les problèmes que vous avez identifiés ;
   - ceux que vous avez traités, et vos choix ;
   - ce que vous feriez avec plus de temps.

Vous pouvez utiliser les outils que vous voulez, **IA comprise**. Lors du débrief, vous présenterez votre rendu et le ferez évoluer en live : vous devez pouvoir expliquer chaque ligne.

## Démarrage

Prérequis : Node.js 20+, Docker.

```bash
docker compose up -d    # Postgres sur le port 55432 (bases virement et virement_test)
npm install
npm test                # doit être vert avant de commencer
```

Pour jouer avec l'API en local (optionnel) :

```bash
npm run seed            # données de démo, affiche les ids de comptes
npm run partner         # faux partenaire bancaire sur :4000 (lent, échoue parfois)
npm start               # API sur :3000
```

```bash
curl localhost:3000/transfers -H 'x-account-id: <id>'

curl -X POST localhost:3000/transfers/batch \
  -H 'x-account-id: <id>' -H 'content-type: application/json' \
  -d '{"transfers":[{"beneficiaryId":"<id>","amount":120.5,"label":"Facture 42"}]}'
```

## Ce qui est fourni

| Chemin                                | Contenu                                                                                                                                            |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/transfer/transfer.controller.ts` | Le code à refactorer                                                                                                                               |
| `src/entities/`                       | Entités TypeORM (`account`, `beneficiary`, `operation`). Le schéma est synchronisé automatiquement (`synchronize: true`), vous pouvez le modifier. |
| `src/setup-app.ts`                    | Configuration globale de l'app (pipes, filtres…), utilisée par `main.ts` **et** par les tests                                                      |
| `test/helpers/test-app.ts`            | `createTestApp()` démarre l'app sur la base de test, `resetDb()` la vide                                                                           |
| `test/fixtures.ts`                    | `createAccount`, `createBeneficiary`, `credit`, `createTransfer`                                                                                   |
| `test/helpers/partner.ts`             | `mockPartnerSuccess()`, `mockPartnerFailure()` : simulent l'API du partenaire (nock)                                                               |
| `test/transfers.e2e.spec.ts`          | Un test d'exemple                                                                                                                                  |

Les tests (`*.spec.ts`, dans `src/` ou `test/`) tournent avec `npm test`, sur la base `virement_test`.

### Contrat HTTP

`GET /transfers` : tableau des virements émis, du plus récent au plus ancien. Chaque élément contient `id`, `accountId`, `beneficiaryId`, `amount`, `label`, `status`, `partnerRef`, `createdAt` et un objet `beneficiary` (`id`, `accountId`, `name`, `iban`, `createdAt`). Le test existant fige ce format.

`POST /transfers/batch` : body `{ "transfers": [{ "beneficiaryId", "amount", "label"? }] }`, montant en euros. La réponse contient un élément par virement, dans l'ordre du lot :

- succès : `{ "beneficiaryId", "ok": true, "ref" }` ;
- échec partenaire : `{ "beneficiaryId", "ok": false }` ;
- virement rejeté : `{ "beneficiaryId", "error" }`, avec `error` parmi `bad amount`, `unknown beneficiary`, `insufficient funds`.

Un body invalide (pas de tableau `transfers`, champ du mauvais type, montant nul ou négatif) peut être rejeté en bloc par une `400` ou virement par virement avec `bad amount` : les deux sont acceptés, justifiez votre choix. Un bénéficiaire inconnu ou un solde insuffisant reste une erreur de ce seul virement : le reste du lot est traité.

### Modèle de données

- `account` : un compte client.
- `beneficiary` : un bénéficiaire enregistré par un compte (`account_id`, `name`, `iban`, `created_at`).
- `operation` : un mouvement sur un compte. Montant positif = crédit, négatif = virement émis (`beneficiary_id` renseigné). `status` : `PENDING` | `COMPLETED` | `FAILED`.

Le solde d'un compte est la somme de ses opérations, hors opérations `FAILED`.

### API du partenaire bancaire

`POST {PARTNER_URL}/sepa` avec `{ "iban": string, "amount": number, "label"?: string }`. **`amount` est en centimes (entier).**
Réponse `201 { "id": string }` en cas de succès, `5xx` en cas d'indisponibilité.

## Rendu

_À compléter._
