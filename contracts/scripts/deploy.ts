import hre from 'hardhat';

async function main() {
  const [deployer] = await hre.viem.getWalletClients();
  const publicClient = await hre.viem.getPublicClient();

  console.log(
    'Deploying contracts with the account:',
    deployer.account.address
  );

  const balance = await publicClient.getBalance({
    address: deployer.account.address,
  });

  console.log('Account balance:', balance.toString());

  // Deploy your contract here
  // Example:
  // const contract = await hre.viem.deployContract("YourContract", [
  //   constructorArg1,
  //   constructorArg2,
  // ]);

  // console.log("Contract deployed to:", contract.address);

  console.log('Deployment completed!');
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
