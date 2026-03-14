describe('Basic Pokedex Flow', () => {
  it('should visit the home page', () => {
    cy.visit('/');
    cy.contains('Poked\'EC', { timeout: 10000 });
  });

  it('should show login page when unauthorized', () => {
    cy.visit('/home');
    cy.url().should('include', '/login');
  });
});
