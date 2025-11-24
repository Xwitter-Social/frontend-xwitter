/// <reference types="cypress" />

interface TestUser {
  id?: string;
  name: string;
  username: string;
  email: string;
  password: string;
  token?: string;
}

interface SeedData {
  backendUrl: string;
  userA: TestUser & { postContent: string };
  userB: TestUser & { postContent: string; postId?: string };
  commentContent: string;
}

interface BackendUser {
  id: string;
  name: string;
  username: string;
  email: string;
  bio?: string | null;
}

const AUTH_COOKIE_NAME = 'xwitter.auth-token';
const STEP_DELAY = 1200;

const pause = () => cy.wait(STEP_DELAY);

const testData: SeedData = {
  backendUrl: '',
  userA: {
    name: '',
    username: '',
    email: '',
    password: '',
    postContent: '',
  },
  userB: {
    name: '',
    username: '',
    email: '',
    password: '',
    postContent: '',
  },
  commentContent: '',
};

let userADeletedViaUi = false;

const resolveBackendUrl = () => {
  const configuredUrl = (Cypress.env('backendUrl') as string | undefined) ?? '';
  if (!configuredUrl) {
    throw new Error(
      'Configure CYPRESS_BACKEND_URL or BACKEND_API_URL before running the tests.',
    );
  }
  return configuredUrl.replace(/\/$/, '');
};

before(() => {
  userADeletedViaUi = false;
  const timestamp = Date.now();
  testData.backendUrl = resolveBackendUrl();

  testData.userA = {
    name: `Cypress Usuário ${timestamp}`,
    username: `cypress_user_${timestamp}`,
    email: `cypress_user_${timestamp}@example.com`,
    password: `Senha#${timestamp}`,
    postContent: `Post criado via Cypress ${timestamp}`,
    id: undefined,
    token: undefined,
  };

  testData.userB = {
    name: `Cypress Alvo ${timestamp}`,
    username: `cypress_alvo_${timestamp}`,
    email: `cypress_alvo_${timestamp}@example.com`,
    password: `Senha#${timestamp}`,
    postContent: `Post do usuário alvo ${timestamp}`,
    id: undefined,
    token: undefined,
  };

  testData.commentContent = `Comentário Cypress ${timestamp}`;
  cy.request<{ id: string }>('POST', `${testData.backendUrl}/user`, {
    name: testData.userB.name,
    username: testData.userB.username,
    email: testData.userB.email,
    password: testData.userB.password,
    bio: 'Conta semente para interações.',
  }).then((userBResponse) => {
    testData.userB.id = userBResponse.body.id;

    return cy
      .request<{ accessToken: string }>(
        'POST',
        `${testData.backendUrl}/auth/signin`,
        {
          identifier: testData.userB.email,
          password: testData.userB.password,
        },
      )
      .then((userBSignInResponse) => {
        testData.userB.token = userBSignInResponse.body.accessToken;

        return cy
          .request<{ id: string }>({
            method: 'POST',
            url: `${testData.backendUrl}/post`,
            headers: {
              Authorization: `Bearer ${testData.userB.token}`,
            },
            body: {
              content: testData.userB.postContent,
            },
          })
          .then((postResponse) => {
            testData.userB.postId = postResponse.body.id;
          });
      });
  });
});

after(() => {
  if (testData.userB.id && testData.userB.token) {
    cy.request({
      method: 'DELETE',
      url: `${testData.backendUrl}/user/${testData.userB.id}`,
      headers: {
        Authorization: `Bearer ${testData.userB.token}`,
      },
      failOnStatusCode: false,
    });
  }

  if (!userADeletedViaUi && testData.userA.id && testData.userA.token) {
    cy.request({
      method: 'DELETE',
      url: `${testData.backendUrl}/user/${testData.userA.id}`,
      headers: {
        Authorization: `Bearer ${testData.userA.token}`,
      },
      failOnStatusCode: false,
    });
  }
});

it('realiza o fluxo social completo com curtidas, reposts e exclusão de conta', () => {
  cy.visit('/');

  cy.contains('button', 'Cadastrar').click();
  pause();

  cy.get('#name').type(testData.userA.name);
  cy.get('#username').type(testData.userA.username);
  cy.get('#signup-email').type(testData.userA.email);
  cy.get('#bio').type('Conta principal criada via Cypress.');
  cy.get('#signup-password').type(testData.userA.password);
  cy.get('#confirm-password').type(testData.userA.password);

  cy.contains('button', 'Criar Conta').click();
  cy.get('#identifier', { timeout: 10000 }).should('be.visible');
  pause();

  cy.get('#identifier').type(testData.userA.email);
  cy.get('#login-password').type(testData.userA.password);
  cy.get('form button[type="submit"]').contains('Entrar').click();

  cy.url({ timeout: 10000 }).should('include', '/timeline');
  pause();

  cy.getCookie(AUTH_COOKIE_NAME)
    .should('exist')
    .then((cookie) => {
      if (cookie) {
        testData.userA.token = cookie.value;
      }
    });

  cy.then(() => {
    if (!testData.userA.token) {
      throw new Error('Token do usuário principal não encontrado.');
    }

    return cy
      .request<BackendUser>({
        method: 'GET',
        url: `${testData.backendUrl}/user/me`,
        headers: {
          Authorization: `Bearer ${testData.userA.token}`,
        },
      })
      .then((response) => {
        testData.userA.id = response.body.id;
      });
  });

  cy.get('textarea[placeholder="O que está acontecendo?"]').type(
    testData.userA.postContent,
  );
  cy.contains('button', 'Postar').filter(':visible').click();
  cy.contains('p', testData.userA.postContent).should('be.visible');
  pause();

  cy.contains('button', 'Buscar').filter(':visible').click();
  cy.url().should('include', '/search');
  pause();

  cy.get('input[placeholder="Buscar posts e pessoas..."]').type(
    testData.userB.username,
  );
  cy.contains('button', 'Pessoas').click();
  cy.contains('p', `@${testData.userB.username}`, { timeout: 10000 }).should(
    'be.visible',
  );

  cy.contains('button', 'Seguir').filter(':visible').click();
  cy.contains('button', 'Parar de seguir', { timeout: 10000 })
    .filter(':visible')
    .should('exist');
  pause();

  pause();

  cy.contains('a', `@${testData.userB.username}`).click();
  cy.url({ timeout: 10000 }).should(
    'include',
    `/profile/${testData.userB.username}`,
  );
  cy.contains('h2', testData.userB.name).should('exist');
  pause();

  pause();

  cy.contains('p', testData.userB.postContent).should('be.visible');
  pause();

  cy.contains('p', testData.userB.postContent)
    .closest('div.flex-1')
    .within(() => {
      pause();
      cy.get('button[title="Curtir post"]').click();
      pause();
      cy.get('button[title="Remover curtida"]').should('exist');

      cy.get('button[title="Repostar"]').click();
      pause();
      cy.get('button[title="Desfazer repost"]').should('exist');
    });

  cy.contains('p', testData.userB.postContent).click();
  cy.url({ timeout: 10000 }).should(
    'include',
    `/post/${testData.userB.postId}`,
  );

  cy.get('textarea[placeholder="Compartilhe sua resposta"]').type(
    testData.commentContent,
  );
  cy.contains('button', 'Responder').filter(':visible').first().click();
  cy.contains('p', testData.commentContent).should('be.visible');
  pause();

  pause();

  cy.get('button[aria-label="Voltar"]').click();
  cy.url({ timeout: 10000 }).should(
    'include',
    `/profile/${testData.userB.username}`,
  );
  pause();

  pause();

  cy.contains('button', 'Timeline').filter(':visible').click();
  cy.url({ timeout: 10000 }).should('include', '/timeline');

  cy.contains('p', testData.userA.postContent).should('be.visible');
  cy.contains('p', testData.userB.postContent)
    .closest('div.flex-1')
    .within(() => {
      pause();
      cy.get('button[title="Remover curtida"]').should('exist');
      pause();
      cy.get('button[title="Desfazer repost"]').should('exist');
      pause();
      cy.contains('button', '1').should('exist');
    });
  cy.contains('span', 'repostou').should('exist');
  pause();

  pause();

  cy.contains('button', 'Perfil').filter(':visible').click();
  cy.url({ timeout: 10000 }).should(
    'include',
    `/profile/${testData.userA.username}`,
  );
  cy.contains('h2', testData.userA.name).should('exist');
  cy.contains('p', testData.userA.postContent).should('exist');

  cy.contains('button', 'Reposts').click();
  cy.contains('p', testData.userB.postContent).should('exist');
  cy.contains('span', 'Repostado').should('exist');

  cy.contains('button', 'Curtidas').click();
  cy.contains('p', testData.userB.postContent).should('exist');
  cy.contains('span', 'Curtido').should('exist');
  pause();

  cy.contains('button', 'Configurações').filter(':visible').click();
  cy.url({ timeout: 10000 }).should('include', '/settings');
  cy.contains('h1', 'Configurações').should('exist');
  pause();

  cy.contains('button', 'Excluir conta').click();
  cy.get('input[name="deleteConfirmation"]').type(testData.userA.username);
  cy.contains('button', 'Confirmar exclusão').click();

  cy.url({ timeout: 10000 })
    .should('eq', `${Cypress.config().baseUrl}/`)
    .then(() => {
      userADeletedViaUi = true;
    });
  cy.contains('h1', 'Xwitter').should('exist');
  cy.contains('button', 'Entrar').should('be.visible');
  cy.contains('button', 'Cadastrar').should('be.visible');
  pause();
});
