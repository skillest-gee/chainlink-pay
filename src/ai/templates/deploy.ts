import { openContractDeploy } from '@stacks/connect';
import { stacksNetwork, appDetails } from '../../config/stacksConfig';

export async function deployContract(options: {
  contractName: string;
  source: string;
  onFinish?: () => void;
  onCancel?: () => void;
}) {
  const { contractName, source, onFinish, onCancel } = options;
  await openContractDeploy({
    network: stacksNetwork,
    appDetails,
    contractName,
    codeBody: source,
    onFinish,
    onCancel,
  });
}

