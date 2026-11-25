/*
 * Tests automatiques du score (sans navigateur, sans dépendance).
 * Lancer depuis la racine du projet : node --test
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const D = require('../src/content/detection.js');
const regles = D.compilerRegles(require('../data/ecoles.json'), require('../data/regles.json'));
const score = (titre, employeur, extrait = '') => D.calculerScore({ titre, employeur, extrait }, regles);

test('école connue comme employeur : floutée', () => {
  assert.strictEqual(score('Alternance Assistant commercial', 'ISCOD').estEcole, true);
  assert.strictEqual(score('Chargé de communication en alternance', 'PIGIER Lyon').estEcole, true);
});

test('vraie offre d\'entreprise en alternance : non floutée', () => {
  const r = score('Alternant(e) contrôleur de gestion', 'Boulangerie Martin',
    'Au sein de notre équipe, vous préparerez votre diplôme en alternance.');
  assert.strictEqual(r.estEcole, false, r.raisons.join(', '));
});

test('entreprise connue : jamais floutée même avec des mots-clés', () => {
  assert.strictEqual(score('Alternance - rentrée septembre - formation diplôme', 'SNCF').estEcole, false);
});

test('annonce d\'école sans nom connu mais avec plusieurs signaux forts : floutée', () => {
  const r = score('Alternance commerce - rentrée 2027', 'Campus Avenir',
    'Rejoignez notre école et nos entreprises partenaires. Inscriptions ouvertes.');
  assert.strictEqual(r.estEcole, true, r.raisons.join(', '));
});

test('un seul mot-clé faible ne suffit pas', () => {
  assert.strictEqual(score('Assistant RH - formation interne', 'Dupont SAS').estEcole, false);
});

test('mot entier : « cfa » ne matche pas « cfao »', () => {
  assert.strictEqual(score('Technicien', 'CFAO Motors').raisons.some((x) => x.includes('cfa')), false);
});
