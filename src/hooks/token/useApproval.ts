import useFxConfirmModal from "@/staging/components/cross-trade/hooks/useCTConfirmModal";
import { useInOutTokens } from "@/hooks/token/useInOutTokens";
import {
  useErc20Approve,
  useErc20TotalSupply,
  usePrepareErc20Approve,
} from "@/generated";
import { useContractWrite } from "wagmi";
import { useCallback, useMemo } from "react";
import { useGetMode } from "../mode/useGetMode";
import useContract from "@/hooks/contracts/useContract";
import useConnectedNetwork from "../network";
import { useTx } from "../tx/useTx";
import { USDT_ADDRESS_BY_CHAINID } from "@/constant/contracts/tokens";
import { useAllowance } from "./useApproveToken";
import { Hash } from "viem";
import { useUniswapContracts } from "../uniswap/useUniswapContracts";
import USDT_ABI from "@/constant/abis/USDT.json";
import { ActionMode } from "@/types/bridgeSwap";

export function useApprove(_mode?: ActionMode) {
  const { mode, subMode } = useGetMode();
  const { inToken } = useInOutTokens();
  const tokenAddress = inToken?.token.address as Hash | undefined;
  const {
    L1BRIDGE_CONTRACT,
    WTON_CONTRACT,
    L1CrossTrade_CONTRACT,
    L2CrossTrade_CONTRACT,
  } = useContract();
  const { UNISWAP_CONTRACT } = useUniswapContracts();
  const { connectedChainId, isLayer2 } = useConnectedNetwork();
  const { ctConfirmModal } = useFxConfirmModal();
  const contractAddress = useMemo(() => {
    switch (mode) {
      case "Deposit":
        return L1BRIDGE_CONTRACT as Hash;
      case "Swap":
        return UNISWAP_CONTRACT?.SWAP_ROUTER_ADDRESS2 as Hash;
      case "Wrap":
      case "Unwrap":
        return WTON_CONTRACT as Hash;
      case "Withdraw":
        if (ctConfirmModal.isOpen)
          return L2CrossTrade_CONTRACT.L2CrossTradeProxy;
      case "Pool": {
        if (subMode.ctPools) return L1CrossTrade_CONTRACT.L1CrossTradeProxy;
        return undefined;
      }
      default:
        return undefined;
    }
  }, [
    mode,
    subMode,
    L1BRIDGE_CONTRACT,
    UNISWAP_CONTRACT,
    WTON_CONTRACT,
    L2CrossTrade_CONTRACT.L2CrossTradeProxy,
    ctConfirmModal.isOpen,
  ]);
  const { isApproved: approved, allowanceIsBiggerThanZero } = useAllowance({
    inputTokenAmount: inToken?.amountBN,
    tokenAddress,
    token: inToken,
    contractAddress,
  });
  const { connectedToLayer1 } = useConnectedNetwork();
  const isApproved = useMemo(() => {
    switch (mode) {
      case "Deposit":
        return approved;
      case "Withdraw":
        if (ctConfirmModal.isOpen) return approved;
        return true;
      case "Swap":
        return approved;
      case "Wrap":
        return approved;
      case "Unwrap":
        return true;
      case "ETH-Wrap":
      case "ETH-Unwrap":
        return true;
      case "Pool": {
        if (subMode.ctPools && connectedToLayer1) return approved;
      }
      default:
        return true;
    }
  }, [mode, subMode, approved, connectedToLayer1]);
  const isUSDT = useMemo(() => {
    return connectedChainId
      ? tokenAddress === USDT_ADDRESS_BY_CHAINID[connectedChainId]
      : undefined;
  }, [connectedChainId, tokenAddress, USDT_ADDRESS_BY_CHAINID]);
  const { data: totalSupply } = useErc20TotalSupply({
    address: tokenAddress,
  });
  const { config, error, isError } = usePrepareErc20Approve({
    address: tokenAddress,
    args:
      contractAddress && totalSupply
        ? [contractAddress, totalSupply]
        : undefined,
    enabled: Boolean(contractAddress && totalSupply),
    chainId: connectedChainId,
  });
  const { data, write } = useErc20Approve(config);
  const { data: usdtApproveData, write: USDT_APPROVE } = useContractWrite({
    address: tokenAddress,
    abi: USDT_ABI,
    functionName: "approve",
  });
  const { data: usdtRevokeData, write: USDT_APPROVE_REVOKE } = useContractWrite(
    {
      address: tokenAddress,
      abi: USDT_ABI,
      functionName: "approve",
    }
  );
  const isRevokeForUSDT = useMemo(() => {
    if (isUSDT && allowanceIsBiggerThanZero && !isLayer2) {
      return true;
    }
    return false;
  }, [isUSDT, allowanceIsBiggerThanZero, isLayer2]);
  const approveForUSDT = useCallback(() => {
    if (isRevokeForUSDT) {
      return USDT_APPROVE_REVOKE({
        args: [contractAddress, 0],
      });
    }
    return USDT_APPROVE({
      args: [contractAddress, totalSupply?.toString()],
    });
  }, [
    contractAddress,
    totalSupply,
    USDT_APPROVE,
    USDT_APPROVE_REVOKE,
    isRevokeForUSDT,
  ]);
  const { isLoading } = useTx({
    hash: isUSDT ? usdtApproveData?.hash : data?.hash,
    txSort: "Approve",
    tokenAddress,
    actionSort: _mode ?? mode,
  });
  const { isLoading: usdtRevokeIsLoading } = useTx({
    hash: usdtRevokeData?.hash,
    txSort: "Revoke",
    tokenAddress,
    actionSort: _mode ?? mode,
  });
  const callApprove = useCallback(() => {
    isUSDT ? approveForUSDT() : write?.();
  }, [
    contractAddress,
    totalSupply,
    isUSDT,
    USDT_APPROVE,
    write,
    approveForUSDT,
  ]);
  return {
    isApproved,
    callApprove,
    isLoading,
    hash: isUSDT ? usdtApproveData?.hash : data?.hash,
    isRevokeForUSDT,
  };
}
