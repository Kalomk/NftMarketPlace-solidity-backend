import { DeployFunction } from "hardhat-deploy/dist/types"
import { HardhatRuntimeEnvironment } from "hardhat/types"
import { verify } from "../utils/verify"

const deployNftMarketPlace: DeployFunction = async function (
    hre: HardhatRuntimeEnvironment
  ) {
    const { deployments, getNamedAccounts, network } = hre
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    log('-----------------------------');

    const nftMarketPlace = await deploy('NFTMarketPlace',{
        from:deployer,
        log:true,
        args:[]
    })

    if ( chainId !== 31337 && process.env.ETHER_SCAN_API ) {
        log("Verifying...")
        await verify(nftMarketPlace.address,[])
    }
    log('-----------------------------')
}

export default deployNftMarketPlace;

deployNftMarketPlace.tags = ['nftMP','all']