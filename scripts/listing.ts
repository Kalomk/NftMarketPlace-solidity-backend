import  { ethers, network } from 'hardhat';
import { BasicNFT,NFTMarketPlace } from '../typechain-types';


const PRICE = ethers.utils.parseEther("0.1")

async function mintAndList() {
    const nftMarketplace:NFTMarketPlace = await ethers.getContract('NFTMarketPlace')
    const basicNft:BasicNFT = await ethers.getContract('BasicNFT')
    console.log("Minting NFT...")
    const mintTx = await basicNft._mintNFT()
    const mintTxReceipt:any = await mintTx.wait(1)
    const tokenId = mintTxReceipt!.events[0]!.args!.tokenId
    console.log("Approving NFT...")
    const approvalTx = await basicNft.approve(nftMarketplace.address, tokenId)
    await approvalTx.wait(1)
    console.log("Listing NFT...")
    const tx = await nftMarketplace.listItem(basicNft.address, tokenId, PRICE)
    await tx.wait(1)
    console.log("NFT Listed!")
}

mintAndList()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })