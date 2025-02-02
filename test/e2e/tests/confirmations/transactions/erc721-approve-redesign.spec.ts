/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires */
import { veryLargeDelayMs, WINDOW_TITLES } from '../../../helpers';
import { Driver } from '../../../webdriver/driver';
import { scrollAndConfirmAndAssertConfirm } from '../helpers';
import {
  openDAppWithContract,
  TestSuiteArguments,
  toggleAdvancedDetails,
} from './shared';

const {
  defaultGanacheOptions,
  defaultGanacheOptionsForType2Transactions,
  withFixtures,
} = require('../../../helpers');
const FixtureBuilder = require('../../../fixture-builder');
const { SMART_CONTRACTS } = require('../../../seeder/smart-contracts');

describe('Confirmation Redesign ERC721 Approve Component', function () {
  const smartContract = SMART_CONTRACTS.NFTS;

  describe('Submit an Approve transaction @no-mmi', function () {
    it('Sends a type 0 transaction (Legacy)', async function () {
      await withFixtures(
        {
          dapp: true,
          fixtures: new FixtureBuilder()
            .withPermissionControllerConnectedToTestDapp()
            .withPreferencesController({
              preferences: {
                redesignedConfirmationsEnabled: true,
                isRedesignedConfirmationsDeveloperEnabled: true,
              },
            })
            .build(),
          ganacheOptions: defaultGanacheOptions,
          smartContract,
          title: this.test?.fullTitle(),
        },
        async ({ driver, contractRegistry }: TestSuiteArguments) => {
          await openDAppWithContract(driver, contractRegistry, smartContract);

          await createMintTransaction(driver);
          await confirmMintTransaction(driver);

          await createApproveTransaction(driver);

          await assertApproveDetails(driver);
          await confirmApproveTransaction(driver);
        },
      );
    });

    it('Sends a type 2 transaction (EIP1559)', async function () {
      await withFixtures(
        {
          dapp: true,
          fixtures: new FixtureBuilder()
            .withPermissionControllerConnectedToTestDapp()
            .withPreferencesController({
              preferences: {
                redesignedConfirmationsEnabled: true,
                isRedesignedConfirmationsDeveloperEnabled: true,
              },
            })
            .build(),
          ganacheOptions: defaultGanacheOptionsForType2Transactions,
          smartContract,
          title: this.test?.fullTitle(),
        },
        async ({ driver, contractRegistry }: TestSuiteArguments) => {
          await openDAppWithContract(driver, contractRegistry, smartContract);

          await createMintTransaction(driver);
          await confirmMintTransaction(driver);

          await createApproveTransaction(driver);
          await assertApproveDetails(driver);
          await confirmApproveTransaction(driver);
        },
      );
    });
  });
});

async function createMintTransaction(driver: Driver) {
  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
  await driver.clickElement('#mintButton');
}

export async function confirmMintTransaction(driver: Driver) {
  await driver.waitUntilXWindowHandles(3);

  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

  await driver.waitForSelector({
    css: 'h2',
    text: 'Transaction request',
  });

  await scrollAndConfirmAndAssertConfirm(driver);
}

async function createApproveTransaction(driver: Driver) {
  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
  await driver.clickElement('#approveButton');
}

async function assertApproveDetails(driver: Driver) {
  await driver.delay(veryLargeDelayMs);
  await driver.waitUntilXWindowHandles(3);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

  await driver.waitForSelector({
    css: 'h2',
    text: 'Allowance request',
  });

  await driver.waitForSelector({
    css: 'p',
    text: 'This site wants permission to withdraw your NFTs',
  });

  await toggleAdvancedDetails(driver);

  await driver.waitForSelector({
    css: 'p',
    text: 'Request from',
  });

  await driver.waitForSelector({
    css: 'p',
    text: 'Interacting with',
  });

  await driver.waitForSelector({
    css: 'p',
    text: 'Method',
  });
}

async function confirmApproveTransaction(driver: Driver) {
  await scrollAndConfirmAndAssertConfirm(driver);

  await driver.delay(veryLargeDelayMs);
  await driver.waitUntilXWindowHandles(2);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.ExtensionInFullScreenView);

  await driver.clickElement({ text: 'Activity', tag: 'button' });
  await driver.waitForSelector(
    '.transaction-list__completed-transactions .activity-list-item:nth-of-type(1)',
  );
}
