import {deployments,ethers,getNamedAccounts,network } from 'hardhat'
import {assert,expect} from 'chai'
import { BasicNFT, NFTMarketPlace } from '../typechain-types';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { BigNumber, Signer } from 'ethers';

describe('NftMarketPlace', async () =>{
    let NftMarketPlaceContract:NFTMarketPlace;
    let deployer: Signer;
    let NftMarketPlace:NFTMarketPlace;
    let BasicNFTContract:BasicNFT;
    let BasicNFT:BasicNFT;
    let user:Signer;

    const TOKEN_ID = 0
    const Price = ethers.utils.parseEther('0.1')
    const lessPrice = ethers.utils.parseEther('0.09')

    beforeEach(async function () {
        const accounts:SignerWithAddress[] = await ethers.getSigners()
        deployer = accounts[0];
        user = accounts[1];
        await deployments.fixture(['all'])
        NftMarketPlaceContract = await ethers.getContract('NFTMarketPlace')
        BasicNFTContract = await ethers.getContract('BasicNFT')
        BasicNFT = BasicNFTContract.connect(deployer)
        NftMarketPlace = NftMarketPlaceContract.connect(deployer)
        await BasicNFT._mintNFT()
        await BasicNFT.approve(NftMarketPlace.address,TOKEN_ID)
    })

    describe('ListItem', async () => {
        it('Revert if price equal or below to zero',async () => {
         await expect(NftMarketPlace.listItem(BasicNFT.address,TOKEN_ID,0)).to.be.revertedWithCustomError(NftMarketPlace,'NFTMarketPlace__CannotSellZeroPrice')
        })
        it('ItemList setting Listing to listings', async () => {
            await NftMarketPlace.listItem(BasicNFT.address,TOKEN_ID,Price)
            const listedItem = await NftMarketPlace.getListed(BasicNFT.address,TOKEN_ID)
            assert.equal(parseInt(listedItem.price as unknown as string),parseInt(Price as any))
            assert.equal(listedItem.seller,(deployer as any).address)
        })
        it('Contract address need to be approved', async () =>{
            await BasicNFT.approve(ethers.constants.AddressZero,TOKEN_ID)
            await expect(NftMarketPlace.listItem(BasicNFT.address,TOKEN_ID,Price))
        })
        it('Emited a event ItemListed', async () => {
            await expect(NftMarketPlace.listItem(BasicNFT.address,TOKEN_ID,Price)).to.be.emit(NftMarketPlace,'ItemListed')
        })
        it('revert if item already listed', async () => {
            await NftMarketPlace.listItem(BasicNFT.address,TOKEN_ID,Price)
            await expect(NftMarketPlace.listItem(BasicNFT.address,TOKEN_ID,Price)).to.be.revertedWithCustomError(NftMarketPlace,'NFTMarketPlace__AlreadyListed')
        })
        it('revert if sender is not an owner', async () => {
            NftMarketPlace = NftMarketPlaceContract.connect(user)
            await BasicNFT.approve((user as any).address,TOKEN_ID)
            await expect(NftMarketPlace.listItem(BasicNFT.address,TOKEN_ID,Price)).to.be.revertedWithCustomError(NftMarketPlace,'NFTMarketPlace__NotAOwner')
        })
    })

    describe('BuyItem', async () => {
        beforeEach(async () => {
        await NftMarketPlace.listItem(BasicNFT.address,TOKEN_ID,Price) 
        })
        it('revert an error if sending value cost less than listing price',async () => {
            await expect( NftMarketPlace.buyItem(BasicNFT.address,TOKEN_ID,{value:lessPrice})).to.be.revertedWithCustomError(NftMarketPlace,'NFTMarketPlace__NotEnougMoneyToMintNft')
        })
        it('Record proceeds to proceeds map', async () => {
            const buyItem = await NftMarketPlace.buyItem(BasicNFT.address,TOKEN_ID,{value:Price})
            const proceed = await NftMarketPlace.getProceed((deployer as any).address)

            assert.equal(parseInt(buyItem.value as any),+proceed)
        })
        it('Emited an event ItemBought', async () => {
            await expect(NftMarketPlace.buyItem(BasicNFT.address,TOKEN_ID,{value:Price})).to.be.emit(NftMarketPlace,'ItemBought')
        })
    })

    describe('ItemCanceled', async () => {
        beforeEach(async () => {
        await NftMarketPlace.listItem(BasicNFT.address,TOKEN_ID,Price) 
        })
        it('Emited an event ItemCanceled',async () => {
            await expect( NftMarketPlace.ListingCancel(BasicNFT.address,TOKEN_ID)).to.be.emit(NftMarketPlace,'ItemCanceled')
        })
         it('delete the item from listing', async () => {
            await NftMarketPlace.ListingCancel(BasicNFT.address,TOKEN_ID)
            const listItem = await NftMarketPlace.getListed(BasicNFT.address,TOKEN_ID)

            assert.equal(+listItem.price, 0)
         })
    })

    describe('ItemUpdate', async () => {
        beforeEach(async () => {
        await NftMarketPlace.listItem(BasicNFT.address,TOKEN_ID,Price) 
        })
        it('Emited an event ItemCanceled',async () => {
            await expect( NftMarketPlace.ListingUpdate(BasicNFT.address,TOKEN_ID,Price)).to.be.emit(NftMarketPlace,'ItemUpdate')
        })
    })

    describe('Withdraw proceeds', async () => {
        it('revert if a sender dosent send any money', async () => {
            await expect( NftMarketPlace.withdrawProceeds()).to.be.revertedWithCustomError(NftMarketPlace,'NFTMarketPlace__CannotWithdrawZeroEth')
        })

        it('Check the correct transfered of proceeds back', async () => {
            await NftMarketPlace.listItem(BasicNFT.address,TOKEN_ID,Price)
            NftMarketPlace = NftMarketPlaceContract.connect(user)
            await NftMarketPlace.buyItem(BasicNFT.address,TOKEN_ID,{value:Price})
            NftMarketPlace = NftMarketPlaceContract.connect(deployer)

            const deployerProceedsBefore = await NftMarketPlace.getProceed((deployer as any).address)
                  const deployerBalanceBefore = await deployer.getBalance()
                  const txResponse = await NftMarketPlace.withdrawProceeds()
                  const transactionReceipt = await txResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)
                  const deployerBalanceAfter = await deployer.getBalance()

                  assert(
                      deployerBalanceAfter.add(gasCost).toString() ==
                          deployerProceedsBefore.add(deployerBalanceBefore).toString()
                  )
        })
    })

})