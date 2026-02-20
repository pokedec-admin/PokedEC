const request = require('supertest');
const app = require('../index');

describe('Test des routes sécurisées', () => {
    it('GET /api/pokemon doit retourner 401 sans jeton', async () => {
        const res = await request(app).get('/api/pokemon');
        expect(res.statusCode).toEqual(401);
    });

    it('GET /api/suggestions/admin doit retourner 401 sans jeton', async () => {
        const res = await request(app).get('/api/suggestions/admin');
        expect(res.statusCode).toEqual(401);
    });
});
