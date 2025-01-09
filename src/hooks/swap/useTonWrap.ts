import { useCallback, useEffect, useMemo, useState } from "react";
import WETH_ABI from "@/abis/WETH.json";
import WTON_ABI from "@/abis/WTON.json";
import { useAccount, useContractWrite } from "wagmi";
import { useInOutTokens } from "../token/useInOutTokens";
import useContract from "../contracts/useContract";
import { useTx } from "../tx/useTx";
import { getWETHAddress } from "@/utils/token/isETH";
import useConnectedNetwork from "../network";
import { useProvier } from "../provider/useProvider";
import { BigNumber, Contract } from "ethers";
import { calculateGasMargin } from "@/utils/txn/calculateGasMargin";
import { useGetMode } from "../mode/useGetMode";
import { asL2Provider } from "@tokamak-network/titan-sdk";

export default function useWrap() {
  const { WTON_CONTRACT } = useContract();
  const { provider } = useProvier();
  const { address } = useAccount();
  const [estimatedGasUsage, setEstimatedGasUsage] = useState<
    BigNumber | undefined
  >(undefined);
  const { mode } = useGetMode();
  const { layer } = useConnectedNetwork();

  const { inToken, outToken } = useInOutTokens();
  const { data, write: swapFromTON } = useContractWrite({
    address: WTON_CONTRACT as `0x${string}`,
    abi: WTON_ABI.abi,
    functionName: "swapFromTON",
  });
  const { data: unwrapData, write: swapToTON } = useContractWrite({
    address: WTON_CONTRACT as `0x${string}`,
    abi: WTON_ABI.abi,
    functionName: "swapToTON",
  });
  const WrapContract = useMemo(() => {
    return new Contract(WTON_CONTRACT, WTON_ABI.abi, provider);
  }, [WTON_CONTRACT, WTON_ABI, provider]);

  const { chainName, isSupportedChain } = useConnectedNetwork();
  const WETH_CONTRACT = chainName && getWETHAddress(chainName);
  const { data: wrapETHData, write: deposit } = useContractWrite({
    address: WETH_CONTRACT as `0x${string}`,
    abi: WETH_ABI,
    functionName: "deposit",
    value: inToken?.amountBN as any,
  });
  const { data: unwrapETHData, write: withdraw } = useContractWrite({
    address: WETH_CONTRACT as `0x${string}`,
    abi: WETH_ABI,
    functionName: "withdraw",
  });

  const isLayer2 = useMemo(() => layer === "L2", [layer]);

  const ETHWrapContract = useMemo(() => {
    try {
      if (isSupportedChain) {
        return new Contract(WETH_CONTRACT as string, WETH_ABI, provider);
      }
    } catch (e) {
      console.log("**ETHWrapContract err**");
      console.log(e);
    }
  }, [isSupportedChain, WETH_CONTRACT, WETH_ABI, provider, address]);

  const {} = useTx({
    hash: data?.hash,
    txSort: "Wrap",
    tokenAddress: inToken?.tokenAddress as `0x${string}`,
  });
  const {} = useTx({
    hash: unwrapData?.hash,
    txSort: "Unwrap",
    tokenAddress: inToken?.tokenAddress as `0x${string}`,
  });
  const {} = useTx({
    hash: wrapETHData?.hash,
    txSort: "ETH-Wrap",
    tokenAddress: inToken?.tokenAddress as `0x${string}`,
  });
  const {} = useTx({
    hash: unwrapETHData?.hash,
    txSort: "ETH-Unwrap",
    tokenAddress: inToken?.tokenAddress as `0x${string}`,
  });

  const wrapTON = useCallback(
    async (estimateGasUsage?: boolean) => {
      if (inToken && inToken.amountBN && provider) {
        const calldata = WrapContract.interface.encodeFunctionData(
          "swapFromTON",
          [inToken.amountBN]
        );
        const estimateGas = BigNumber.from(100000);
        const estimateGasWithBuffer = calculateGasMargin(estimateGas);
        if (estimateGasUsage) return estimateGasWithBuffer;
        try {
          swapFromTON({
            args: [inToken.amountBN],
            gas: estimateGasWithBuffer.toBigInt(),
          });
        } catch (e) {
          console.log("**wrapTON err**");
          console.log(e);
        }
      }
    },
    [inToken, WrapContract, provider]
  );

  const unwrapWTON = useCallback(
    async (estimateGasUsage?: boolean) => {
      if (inToken && inToken.amountBN && provider) {
        const calldata = WrapContract.interface.encodeFunctionData(
          "swapToTON",
          [inToken.amountBN]
        );

        const estimateGas = await provider.estimateGas({
          to: WrapContract.address,
          data: calldata,
          from: address,
        });
        const estimateGasWithBuffer = calculateGasMargin(estimateGas);
        if (estimateGasUsage) return estimateGasWithBuffer;
        try {
          swapToTON({
            args: [inToken.amountBN],
            gas: estimateGasWithBuffer.toBigInt(),
          });
        } catch (e) {
          console.log("**unwrapWTON err**");
          console.log(e);
        }
      }
    },
    [inToken, WrapContract, provider]
  );

  const wrapETH = useCallback(
    async (estimateGasUsage?: boolean) => {
      if (inToken && inToken.amountBN && ETHWrapContract && provider) {
        try {
          let estimateGas;
          let estimatedGasForL2 = undefined;
          if (isLayer2) {
            const calldata =
              ETHWrapContract.interface.encodeFunctionData("deposit");
            const l2Provider = asL2Provider(provider);
            const txData = {
              to: ETHWrapContract.address,
              data: calldata,
              from: address,
              value: BigNumber.from(inToken.amountBN),
            };

            estimateGas = await l2Provider.estimateTotalGasCost(txData);
            estimatedGasForL2 = await provider.estimateGas(txData);
            estimatedGasForL2 = calculateGasMargin(estimatedGasForL2);
          } else {
            const calldata =
              ETHWrapContract.interface.encodeFunctionData("deposit");
            estimateGas = await provider.estimateGas({
              to: ETHWrapContract.address,
              data: calldata,
              from: address,
              value: BigNumber.from(inToken.amountBN),
            });
          }
          const estimateGasWithBuffer = calculateGasMargin(estimateGas);

          if (estimateGasUsage) return estimateGas;
          if (
            (isLayer2 && estimatedGasForL2) ||
            (!isLayer2 && estimateGasWithBuffer)
          ) {
            deposit({
              gas: isLayer2
                ? estimatedGasForL2?.toBigInt()
                : estimateGasWithBuffer.toBigInt(),
            });
          }
        } catch (e) {
          console.log("**wrapTON err**");
          console.log(e);
        }
      }
    },
    [inToken, ETHWrapContract, provider, isLayer2]
  );

  const unwrapWETH = useCallback(
    async (estimateGasUsage?: boolean) => {
      if (inToken && inToken.amountBN && ETHWrapContract && provider) {
        let estimateGas = undefined;
        let estimatedGasForL2 = undefined;

        if (isLayer2) {
          const calldata = ETHWrapContract.interface.encodeFunctionData(
            "withdraw",
            [inToken.amountBN]
          );
          const l2Provider = asL2Provider(provider);
          const txData = {
            to: ETHWrapContract.address,
            data: calldata,
            from: address,
          };

          estimateGas = await l2Provider.estimateTotalGasCost(txData);
          estimatedGasForL2 = await provider.estimateGas(txData);
          estimatedGasForL2 = calculateGasMargin(estimatedGasForL2);
        } else {
          estimateGas = await ETHWrapContract.estimateGas.withdraw(
            inToken.amountBN
          );
        }
        const estimateGasWithBuffer = calculateGasMargin(estimateGas);

        if (estimateGasUsage) return estimateGasWithBuffer;

        if (
          (isLayer2 && estimatedGasForL2) ||
          (!isLayer2 && estimateGasWithBuffer)
        ) {
          withdraw({
            args: [inToken.amountBN],
            gas:
              layer === "L2"
                ? estimatedGasForL2?.toBigInt()
                : estimateGasWithBuffer.toBigInt(),
          });
        }
      }
    },
    [inToken, ETHWrapContract, provider, isLayer2]
  );

  useEffect(() => {
    const fetchEstimatedGasUsage = async () => {
      const estimatedGas =
        mode === "Wrap"
          ? await wrapTON(true)
          : mode === "Unwrap"
          ? await unwrapWTON(true)
          : mode === "ETH-Wrap"
          ? await wrapETH(true)
          : mode === "ETH-Unwrap"
          ? await unwrapWETH(true)
          : undefined;
      if (estimatedGas) setEstimatedGasUsage(estimatedGas);
    };

    fetchEstimatedGasUsage();
  }, [mode, inToken, outToken]);

  return { wrapTON, unwrapWTON, wrapETH, unwrapWETH, estimatedGasUsage };
}
