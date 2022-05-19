import React from "react";
import {
  Button,
  Box,
  Input,
  Radio,
  RadioGroup,
  Stack,
  FormControl,
  FormErrorMessage,
  useToast,
} from "@chakra-ui/react";
import { useState } from "react";
import { ethers } from "ethers";
import { useWeb3React } from "@web3-react/core";
import { Web3Provider } from "@ethersproject/providers";
import { injected } from "../lib/web3/injected";
import config from "../lib/web3/config.json";
import { wrapperSourceABI } from "../lib/web3/abis/wrapperSourceABI";
import { IERC721ABI } from "../lib/web3/abis/IERC721ABI";

export const Wrap: React.FC = () => {
  const [direction, setDirection] = useState("source");
  const [nftContractAddress, setNFTContractAddress] = useState("");
  const [isNFTContractAddressInvalid, setIsNFTContractAddressInvalid] = useState(false);
  const [sendFromAddress, setSendFromAddress] = useState("");
  const [tokenId, setTokenId] = useState("");
  const [isTokenIdInvalid, setTokenIdInvalid] = useState(false);
  const [destinationDomainId, setDestinationDomainId] = useState("");
  const [isDestinationDomainIdInvalid, setDestinationDomainIdInvalid] = useState(false);
  const toast = useToast();

  const { activate, library, account } = useWeb3React<Web3Provider>();

  const handleDirectionChange = (e: any) => {
    const inputValue = e;
    setDirection(inputValue);
  };

  const handleNFTContractAddressChange = (e: any) => {
    const inputValue = e.target.value;
    setNFTContractAddress(inputValue);
    setIsNFTContractAddressInvalid(false);
  };
  const handleTokenIdChange = (e: any) => {
    const inputValue = e.target.value;
    setTokenId(inputValue);
    setTokenIdInvalid(false);
  };
  const handleDestinationDomainIdChange = (e: any) => {
    const inputValue = e.target.value;
    setDestinationDomainId(inputValue);
    setDestinationDomainIdInvalid(false);
  };

  const connect = async () => {
    activate(injected);
  };

  const xCall = async () => {
    if (!library) {
      return;
    }
    let isError = false;
    if (!nftContractAddress) {
      setIsNFTContractAddressInvalid(true);
      isError = true;
    } else {
      setIsNFTContractAddressInvalid(false);
    }
    if (!tokenId) {
      setTokenIdInvalid(true);
      isError = true;
    } else {
      setTokenIdInvalid(false);
    }
    if (!destinationDomainId) {
      setDestinationDomainIdInvalid(true);
      isError = true;
    } else {
      setDestinationDomainIdInvalid(false);
    }
    if (isError) {
      return;
    }
    const { name } = await library.getNetwork();
    const bridgeContract = (config as any).wrap[name][direction];
    const nftContract = new ethers.Contract(nftContractAddress, IERC721ABI, library.getSigner());
    const approvedAddress = await nftContract.getApproved(tokenId);
    const isApprovedForAll = await nftContract.isApprovedForAll(account, bridgeContract);
    console.log(approvedAddress, "approvedAddress");
    console.log(isApprovedForAll, "isApprovedForAll");

    if (approvedAddress != bridgeContract && isApprovedForAll != true) {
      await nftContract.setApprovalForAll(bridgeContract, true);
    }
    const contract = new ethers.Contract(bridgeContract, wrapperSourceABI, library.getSigner());
    const transaction = await contract.xSend(nftContractAddress, account, account, tokenId, destinationDomainId);
    transaction
      .wait(1)
      .then((tx: any) => {
        console.log(tx);
        toast({
          title: `Bridge Tx Hash: ${tx.transactionHash}`,
          status: "success",
          isClosable: true,
        });
      })
      .catch((err: any) => {
        toast({
          title: `${err.message}`,
          status: "error",
          isClosable: true,
        });
      });
  };

  return (
    <Box textAlign="center" experimental_spaceY="5">
      <RadioGroup defaultValue="source" onChange={handleDirectionChange}>
        <Stack spacing={5} direction="row">
          <Radio name="direction" value="source">
            Wrap
          </Radio>
          <Radio name="direction" value="target">
            Unwrap
          </Radio>
        </Stack>
      </RadioGroup>
      <FormControl isInvalid={isNFTContractAddressInvalid}>
        <Input placeholder="NFT contract address" onChange={handleNFTContractAddressChange} />
        <FormErrorMessage>Required</FormErrorMessage>
      </FormControl>
      <FormControl isInvalid={isTokenIdInvalid}>
        <Input placeholder="Token ID" onChange={handleTokenIdChange} />
        <FormErrorMessage>Required</FormErrorMessage>
      </FormControl>
      <FormControl isInvalid={isDestinationDomainIdInvalid}>
        <Input placeholder="Destination domain ID" onChange={handleDestinationDomainIdChange} />
        <FormErrorMessage>Required</FormErrorMessage>
      </FormControl>
      {!account ? (
        <Button width="100%" onClick={connect} fontSize={"sm"}>
          Connect Wallet
        </Button>
      ) : (
        <Button width="100%" onClick={xCall} fontSize={"sm"}>
          Bridge
        </Button>
      )}
    </Box>
  );
};
