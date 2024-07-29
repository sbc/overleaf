/**
 * Helper function for opening an email in Roundcube based mailtrap.
 * We need to cross an origin boundary, which complicates the use of variables.
 * Any variables need to be explicitly defined and the "runner" may only reference these and none from its scope.
 * It is not possible to use Cypress helper functions, e.g. from the testing library inside the "runner".
 * REF: https://github.com/testing-library/cypress-testing-library/issues/221
 */
export function openEmail<T>(
  subject: string | RegExp,
  runner: (frame: Cypress.Chainable<JQuery<any>>, args?: T) => void,
  args?: T
) {
  const runnerS = runner.toString()
  cy.origin(
    'http://mailtrap',
    { args: { args, runnerS, subject } },
    ({ args, runnerS, subject }) => {
      cy.visit('/')
      cy.get('input[name="_user"]').type('mailtrap')
      cy.get('input[name="_pass"]').type('password-for-mailtrap')
      cy.get('button[type="submit"]').click()
      cy.log('mailtrap login is flaky in cypress, submit again')
      cy.get('input[name="_pass"]').type('password-for-mailtrap')
      cy.get('button[type="submit"]').click()
      // Use force as the subject is partially hidden
      cy.contains(subject).click({ force: true })
      cy.log('wait for iframe loading')
      cy.wait(1000)
      cy.get('iframe[id="messagecontframe"]').then(frame => {
        // runnerS='(frame, args) => { runner body }'. Extract the runnable function.
        const runner = new Function('return ' + runnerS)()
        runner(cy.wrap(frame.prop('contentWindow').document.body), args)
      })
    }
  )
}
