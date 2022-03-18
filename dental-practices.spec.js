import { PracticesPage } from '../../support/pages/superadmin';

const page = new PracticesPage();
const faker = require('faker');

context('SuperAdmin / Dental Practices page checks', () => {
  beforeEach(() => {
    cy.loginAs('super-admin', 'super-admin');
    cy.intercept('GET', '**/api/v1/practiceManagement?filter**').as(
      'practicesList'
    );
    cy.intercept('GET', '**/api/v1/kleerRevenueChart?**').as('totalRevenue');
    page.visit();
  });

  it('C2433 Checking visibility of the table.', () => {
    cy.get('h3', { timeout: 10000 }).should('contain', 'Dental Practices');
    page.getPracticesTable().and('be.visible');
  });

  it('C580272 Table headers checking', () => {
    cy.get('h3', { timeout: 10000 }).should('contain', 'Dental Practices');
    page.getPracticesTable().and('be.visible');
    cy.getTableHead('dentist-practices-table').shouldHaveHeaders([
      'Practice Name',
      'Group',
      'Status',
      'Zip Code',
      'State',
      'Dentists',
      'Members',
      'Employers',
      'Practice Revenue',
      'Date Registered',
      'Payments Enabled',
      'Charges Enabled'
    ]);
  });

  it('C421221 Practices details link.', () => {
    cy.get('h3').should('contain', 'Dental Practices');
    page.getPracticesTable().and('be.visible');
    cy.getPracticeNameItemByNumber('practice-name', 0).as(
      'firstPracticeNameLink'
    );
    cy.get('@firstPracticeNameLink').should('have.attr', 'href');
    cy.get('@firstPracticeNameLink')
      .invoke('text')
      .then(text => {
        cy.wrap(text).as('practiceName');
      });
    cy.get('@firstPracticeNameLink').click();
    cy.url()
      .should('include', '/dashboard/dentist/practices/')
      .and('include', '/details');
    cy.getByTestId('dentist-practice-title')
      .invoke('text')
      .then(text => {
        cy.get('@practiceName').then(practiceName => {
          expect(text).include(practiceName);
        });
      });
  });

  it('C580275 Group details link.', () => {
    cy.get('h3').should('contain', 'Dental Practices');
    page.getPracticesTable().and('be.visible');
    cy.getGroupNameItemByNumber('group-name', 0).as('firstGroupNameLink');
    if (cy.get('@firstGroupNameLink').should('have.attr', 'href') === true) {
      cy.get('@firstGroupNameLink').click();
    } else {
      cy.request('/api/v1/dentistGroups?page%5Blimit%5D=1')
        .its('body.data.0.attributes')
        .then(({ name }) => {
          page
            .getSearchGroupField()
            .and('be.enabled')
            .and('be.visible')
            .type(name);
          cy.wait(1000); //cant resolve how to be without  "wait"

          page.getFirstItemInGroupSearchDropdown();
          cy.wait(10000)
          cy.get('@firstGroupNameLink').click();
        });
    }

    cy.url().should('include', '/dashboard/groups/');
  });

  it('C2434 Search Dental Practices.Entering Existing Dental practice name.', () => {
    page.getSearchPracticesField().and('be.enabled');
    cy.wait('@practicesList').then(({ response }) => {
      cy.expect(response.statusCode).eq(200);
      const nameResponse = response.body.data[9].attributes.name;
      cy.intercept('GET', '**/api/v1/practiceManagement?filter**').as(
        'searchResult'
      );
      page.getSearchPracticesField().type(nameResponse, '{enter}');
      cy.wait('@searchResult').then(({ response }) => {
        const tableLength = ++response.body.data.length;
        cy.get('tr.MuiTableRow-root').should('have.length', tableLength);
        cy.getPracticeNameItemByNumber('practice-name', 0).should(
          'contain',
          nameResponse
        );
      });
    });
  });

  it('C587170 Search Dental Practices.Entering Unexisting Dental practice name.', () => {
    page.getSearchPracticesField().and('be.enabled');
    cy.wait('@practicesList').then(({ response }) => {
      cy.expect(response.statusCode).eq(200);
      cy.intercept('GET', '**/api/v1/practiceManagement?filter**').as(
        'searchResult'
      );
      const randomPracticeName = faker.company.companyName();
      page.getSearchPracticesField().type(randomPracticeName, '{enter}');
      cy.wait('@searchResult').then(({ response }) => {
        let searchResultLength = response.body.data.length;
        cy.expect(searchResultLength).eq(0);
        let lengthOfTable = ++searchResultLength;
        cy.get('tr.MuiTableRow-root').should('have.length', lengthOfTable);
      });
    });
  });

  it('C48877 Search by Dentist Group.', () => {
    cy.request('/api/v1/dentistGroups?page%5Blimit%5D=1')
      .its('body.data.0.attributes')
      .then(({ name }) => {
        cy.request(`/api/v1/dentistGroups?filter%5Bname%5D%5B0%5D=${name}`)
          .its('body')
          .then(({ data }) => {
            let tableLength = ++data[0].attributes.practicesCount;

            page
              .getSearchGroupField()
              .and('be.enabled')
              .and('be.visible')
              .type(name);
            cy.wait(1000); //cant resolve how to be without  "wait"

            page.getFirstItemInGroupSearchDropdown();
            page.getTableRaws().should('have.length', tableLength);
          });
      });
  });

  it('C2435 Practice Details. Main elements.', () => {
    page.getPracticesTable().should('be.visible');
    cy.getPracticeNameItemByNumber('practice-name', 0).click();
    cy.url()
      .should('include', '/dashboard/dentist/practices/')
      .and('include', '/details');
    page.consumerCodeLinkVerification().employerCodeLinkVerification();
    page.getPrimaryKsmField().should('be.visible');
    page.getPrimaryKSMLabel().should('be.visible');
    page.getAdvantageLevel().should('be.visible');
    //TODO:need add "thermomrter" checking
    page.getPracticeRevenueBox().should('be.visible');
    page.getKleerRevenueBox().should('be.visible');
    page.getGroupInfoSection().click();
    page.getPracticeInfoSection().click();
    page.getParticipatingOfficesSection().click();
    page.getParticipatingDentistsSection().click();
    page.getMembershipPlanSection().click();
    page.getBankAccountInformationSection().click();
    page.getOfficeMaterialsSection().click();
  });

  it(' C598616 Practices   Tab. Practice Details. Archive Button.Checking for Archived user', () => {
    cy.request(
      '/api/v1/practiceManagement?filter%5Bstatus%5D%5B0%5D=archived&page%5Blimit%5D=1'
    )
      .its('body.data.0')
      .then(({ id }) => {
        cy.visit(`/dashboard/dentist/practices/${id}/details`);
        cy.getByTestId('super-admin-archive-button', { timeout: 5000 })
          .should('have.text', 'Unarchive Practice')
          .click();
        cy.getByTestId('super-admin-archive-button', { timeout: 5000 }).should(
          'have.text',
          'Archive practice'
        );
        cy.request(`/api/v1/practices/${id}`)
          .its('body.data.attributes')
          .then(({ status }) => {
            cy.expect(status).eq('active');
            cy.getByTestId('super-admin-archive-button', {
              timeout: 5000
            }).click();
            cy.getByTestId('super-admin-archive-button', {
              timeout: 5000
            }).should('have.text', 'Unarchive Practice');
          });
      });
  });

  it('C48899 Practice Details. Archive Button.Checking for Active user', () => {
    cy.request(
      '/api/v1/practiceManagement?filter%5Bstatus%5D%5B0%5D=active&page%5Blimit%5D=1'
    )
      .its('body.data.0')
      .then(({ id }) => {
        cy.visit(`/dashboard/dentist/practices/${id}/details`);
        cy.getByTestId('super-admin-archive-button')
          .should('have.text', 'Archive practice')
          .click();
        cy.getByTestId('super-admin-archive-button').should(
          'have.text',
          'Unarchive Practice'
        );
        cy.request(`/api/v1/practices/${id}`)
          .its('body.data.attributes')
          .then(({ status }) => {
            cy.expect(status).eq('archived');
            cy.getByTestId('super-admin-archive-button').click();
            cy.getByTestId('super-admin-archive-button').should(
              'have.text',
              'Archive practice'
            );
          });
      });
  });

  it('C592780 Practice Details. Archive Button.Checking for Pending user', () => {
    cy.request(
      '/api/v1/practiceManagement?filter%5Bstatus%5D%5B0%5D=pending&page%5Blimit%5D=1'
    )
      .its('body.data.0')
      .then(({ id }) => {
        cy.visit(`/dashboard/dentist/practices/${id}/details`);
        cy.getByTestId('view-as-dentist-button').should('be.visible');
        cy.getByTestId('super-admin-archive-button').should('not.exist');
      });
  });

  it(' C598617  Practice Details. Archive Button.Checking for Verified user', () => {
    cy.request(
      '/api/v1/practiceManagement?filter%5Bstatus%5D%5B0%5D=verified&page%5Blimit%5D=1'
    )
      .its('body.data.0')
      .then(({ id }) => {
        cy.visit(`/dashboard/dentist/practices/${id}/details`);
        cy.getByTestId('view-as-dentist-button').should('be.visible');
        cy.getByTestId('super-admin-archive-button').should('not.exist');
      });
  });

  it('C48900 Practice Details. Office Code link for Active user', () => {
    cy.request(
      '/api/v1/practiceManagement?filter%5Bstatus%5D%5B0%5D=active&page%5Blimit%5D=1'
    )
      .its('body.data.0')
      .then(({ id }) => {
        cy.visit(`/dashboard/dentist/practices/${id}/details`);
        cy.getByTestId('consumer-office-code-link').should('have.attr', 'href');
        cy.getByTestId('consumer-office-code-link').within(() => {
          cy.contains('Consumer office code: ')
            .should('be.visible')
            .invoke('removeAttr', 'target')
            .click();
        });
        cy.contains('No Insurance?').should('be.visible');
      });
  });

  it('C606196 Practice Details. Office Code link for Archived user', () => {
    cy.request(
      '/api/v1/practiceManagement?filter%5Bstatus%5D%5B0%5D=archived&page%5Blimit%5D=1'
    )
      .its('body.data.0')
      .then(({ id }) => {
        cy.visit(`/dashboard/dentist/practices/${id}/details`);
        cy.getByTestId('consumer-office-code-link').should('have.attr', 'href');
        cy.getByTestId('consumer-office-code-link').within(() => {
          cy.contains('Consumer office code: ')
            .should('be.visible')
            .invoke('removeAttr', 'target')
            .click();
        });
        cy.url().should('include', '404');
        cy.contains('404. Page not found');
      });
  });

  it('C606197 Practice Details. Office Code link for Verified user', () => {
    cy.request(
      '/api/v1/practiceManagement?filter%5Bstatus%5D%5B0%5D=verified&page%5Blimit%5D=1'
    )
      .its('body.data.0')
      .then(({ id }) => {
        cy.visit(`/dashboard/dentist/practices/${id}/details`);
        cy.getByTestId('consumer-office-code-link').should('have.attr', 'href');
        cy.getByTestId('consumer-office-code-link').within(() => {
          cy.contains('Consumer office code: ')
            .should('be.visible')
            .invoke('removeAttr', 'target')
            .click();
        });
        cy.url().should('include', '404');
        cy.contains('404. Page not found');
      });
  });

  it('C606195 Practice Details. Office Code link for Pending user', () => {
    cy.request(
      '/api/v1/practiceManagement?filter%5Bstatus%5D%5B0%5D=pending&page%5Blimit%5D=1'
    )
      .its('body.data.0')
      .then(({ id }) => {
        cy.visit(`/dashboard/dentist/practices/${id}/details`);
        cy.getByTestId('consumer-office-code-link').should('have.attr', 'href');
        cy.getByTestId('consumer-office-code-link').within(() => {
          cy.contains('Consumer office code: ')
            .should('be.visible')
            .invoke('removeAttr', 'target')
            .click();
        });
        cy.url().should('include', '404');
        cy.contains('404. Page not found');
      });
  });

  it(' C580535 Practice Details.Kleer Advantage Level thermometer.', () => {
    cy.request(
      '/api/v1/practiceManagement?filter%5Bstatus%5D%5B0%5D=active&sort=name&page%5Boffset%5D=0&page%5Blimit%5D=1&ownPractices=false&filter%5BmembersCount%5D%5B0%5D=>4'
    )
      .its('body.data.0')
      .then(user => {
        let activeUserId = user.id;
        let membersAmount = user.attributes.membersCount;
        cy.visit(`/dashboard/dentist/practices/${activeUserId}/details`);
        cy.getByTestId('kleer-advantage-levels-box').within(() => {
          cy.getByTestId('kleer-advantage-levels-title').should('be.visible');
          cy.getByTestId('kleer-advantage-progress-count').should(
            'contain',
            membersAmount
          );
          cy.getByTestId('advantage-levels-Kleer Expert')
            .should('contain', '25')
            .and('contain', 'Kleer Expert');
          cy.getByTestId('advantage-levels-Kleer Pro')
            .should('contain', '100')
            .and('contain', 'Kleer Pro');
          cy.getByTestId('advantage-levels-Kleer Preferred')
            .should('contain', '250')
            .and('contain', 'Kleer Preferred');
          cy.getByTestId('advantage-levels-Kleer Select')
            .should('contain', '500')
            .and('contain', 'Kleer Select');
          cy.getByTestId('advantage-levels-Kleer Premier')
            .should('contain', '1,000')
            .and('contain', 'Kleer Premier');
          cy.getByTestId('kleer-advantage-i-button-base').click();
        });
        cy.get('div[role="dialog"').within(() => {
          cy.contains('h4', 'Kleer Advantage Levels');
          cy.get('.MuiTableHead-root').shouldHaveHeaders([
            'Member Milestone',
            'Level',
            'Awards',
            'Kleer Fees'
          ]);
          cy.get('button').click();
        });
      });
  });
  it('C48902 Practice Details. Boxes. Practice Revenue Box.', () => {
    cy.getPracticeNameItemByNumber('practice-name', 0).click({force:true})
    cy.getByTestId('card-revenue')
      .eq(0)
      .find('span')
      .invoke('text')
      .then(text => {
        cy.wait('@totalRevenue').then(intercept => {
          const practiceRevenue = page.getTotalSum(
            intercept,
            'practiceRevenueByMonth'
          );
          expect(text).eq(practiceRevenue);
        });
      });
    page.visit();
    cy.getPracticeNameItemByNumber('practice-name', 2).click({force:true});
    cy.getByTestId('card-revenue')
      .eq(0)
      .find('span')
      .invoke('text')
      .then(text => {
        cy.wait('@totalRevenue').then(intercept => {
          const practiceRevenue = page.getTotalSum(
            intercept,
            'practiceRevenueByMonth'
          );
          expect(text).eq(practiceRevenue);
        });
      });
    page.visit();
    cy.getPracticeNameItemByNumber('practice-name', 8).click({force:true});
    cy.getByTestId('card-revenue')
      .eq(0)
      .find('span')
      .invoke('text')
      .then(text => {
        cy.wait('@totalRevenue').then(intercept => {
          const practiceRevenue = page.getTotalSum(
            intercept,
            'practiceRevenueByMonth'
          );
          expect(text).eq(practiceRevenue);
        });
      });
  });
  it('C580534 Practice Details. Kleer Revenue Box.', () => {
    cy.getPracticeNameItemByNumber('practice-name', 1).click({force:true});
    cy.getByTestId('card-revenue')
      .eq(1)
      .find('span')
      .invoke('text')
      .then(text => {
        cy.wait('@totalRevenue').then(intercept => {
          const practiceRevenue = page.getTotalSum(
            intercept,
            'kleerRevenueByMonth'
          );
          expect(text).eq(practiceRevenue);
        });
      });
    page.visit();
    cy.getPracticeNameItemByNumber('practice-name', 3).click({force:true});
    cy.getByTestId('card-revenue')
      .eq(1)
      .find('span')
      .invoke('text')
      .then(text => {
        cy.wait('@totalRevenue').then(intercept => {
          const practiceRevenue = page.getTotalSum(
            intercept,
            'kleerRevenueByMonth'
          );
          expect(text).eq(practiceRevenue);
        });
      });
    page.visit();
    cy.getPracticeNameItemByNumber('practice-name', 9).click({force:true});
    cy.getByTestId('card-revenue')
      .eq(1)
      .find('span')
      .invoke('text')
      .then(text => {
        cy.wait('@totalRevenue').then(intercept => {
          const practiceRevenue = page.getTotalSum(
            intercept,
            'kleerRevenueByMonth'
          );
          expect(text).eq(practiceRevenue);
        });
      });
  });
  it('C54234 Practices Tab. Practices table.Checking the total number of active members.', () => {
    cy.wait('@practicesList').then(({ response }) => {
      let values = [];
      let numberInResponse = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
      numberInResponse.forEach(function(element) {
        let membersAmount = response.body.data[element].attributes.membersCount;
        values.push(membersAmount);
        cy.getByTestId('membersCount')
          .eq(element)
          .should('have.text', values[element]);
      });
    });
  });
});
