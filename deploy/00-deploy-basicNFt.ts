import { HardhatRuntimeEnvironment } from "hardhat/types"
import { DeployFunction } from "hardhat-deploy/dist/types";
import { verify } from "../utils/verify";


const deployBasicNFT:DeployFunction = async (hre:HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts, network } = hre
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()
  const chainId = network.config.chainId

  const args:any[] = []
  log('-----------------------------')
  const basicNFT = await deploy("BasicNFT", {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: 1,
})

if (chainId != 31337 && process.env.ETHER_SCAN_API ) {
  log("Verifying...")
  await verify(basicNFT.address, args)
}
log('-----------------------------')
}

export default deployBasicNFT;

deployBasicNFT.tags = ['all','basicNft']