import { useAccount, useBalance } from "wagmi";
import { ethers } from "ethers";
import commafy from "@/utils/trim/commafy";
import { TokenInfo } from "@/types/token/supportedToken";
import { useEffect, useMemo, useState } from "react";
import useConnectedNetwork, { useInOutNetwork } from "@/hooks/network";
import { SupportedChainId } from "@/types/network/supportedNetwork";
import useTokenModal from "@/hooks/modal/useTokenModal";
import { useInOutTokens } from "@/hooks/token/useInOutTokens";
import { findTokenAmount } from "@/staging/components/legacy-titan/utils/l2TokenAssets";
import { ZERO_ADDRESS } from "@/constant/misc";
import { FetchBalanceResult } from "wagmi/dist/actions";
import { useGb } from "@/staging/hooks/legacyTitan/gb";
import { useGetForcePosition } from "@/staging/hooks/legacyTitan/getForcePosition";
import { useRecoilState } from "recoil";
import { transactionModalStatus } from "@/recoil/modal/atom";

export default function useTokenBalance(
  tokenInfo: TokenInfo | null,
  requireCall?: boolean,
  watch?: boolean
) {
  const { chainName } = useConnectedNetwork();
  const [modalOpen] = useRecoilState(transactionModalStatus);

  const isETH = tokenInfo?.isNativeCurrency?.includes(
    SupportedChainId.MAINNET ||
      SupportedChainId.TITAN ||
      SupportedChainId.SEPOLIA
  );
  const tokenAddress = chainName && tokenInfo?.address[chainName];
  const { address: accountAddress } = useAccount();
  const { isInTokenOpen, isOutTokenOpen } = useTokenModal();
  const { inToken, outToken } = useInOutTokens();
  const isOnUI =
    inToken?.address === tokenAddress || outToken?.address === tokenAddress;
  const { isLayer2 } = useConnectedNetwork();
  const { inNetwork } = useInOutNetwork();

  const isLayer1 = useMemo(() => {
    return (
      inNetwork?.chainId === SupportedChainId.MAINNET ||
      inNetwork?.chainId === SupportedChainId.SEPOLIA
    );
  }, [inNetwork?.chainId]);
  const { data, error, isLoading, isSuccess } = useBalance({
    address: accountAddress,
    token: isETH ? undefined : (tokenAddress as "0x${string}") ?? null,
    watch: isInTokenOpen || isOutTokenOpen ? true : watch,
    staleTime: isLayer2 ? 2000 : 5000,
    enabled: requireCall && chainName !== "THANOS_SEPOLIA" && isLayer1,
  });
  const { isConnectedToMainNetwork } = useConnectedNetwork();
  const [legacyWithdrawalHash, setLegacyWithdrawalHash] = useState<
    string | null
  >(null);

  const {
    gb,
    isLoading: gbIsLoading,
    isError: gbIsError,
  } = useGb(legacyWithdrawalHash);

  const {
    forcePosition,
    isLoading: forcePositionIsLoading,
    isError: forcePositionIsError,
  } = useGetForcePosition(legacyWithdrawalHash || "");

  const tokenBalance = useMemo(() => {
    if (!tokenInfo) return null;
    if (chainName === "TITAN_SEPOLIA" || chainName === "TITAN") {
      const tokenData = findTokenAmount(
        isConnectedToMainNetwork
          ? tokenInfo?.address["MAINNET"] || ZERO_ADDRESS
          : tokenInfo?.address["SEPOLIA"] || ZERO_ADDRESS,
        isConnectedToMainNetwork
          ? tokenInfo?.address["TITAN"] || ZERO_ADDRESS
          : tokenInfo?.address["TITAN_SEPOLIA"] || ZERO_ADDRESS,
        accountAddress as string,
        isConnectedToMainNetwork ? "mainnet" : "sepolia"
      );
      const withdrawalHash = tokenData?.data?.hash;
      setLegacyWithdrawalHash(withdrawalHash || null);
      const amount = gb === false ? tokenData?.data?.amount : 0;

      const tokenBalanceData: FetchBalanceResult = {
        decimals: tokenInfo?.decimals as number,
        formatted: commafy(
          ethers.utils.formatUnits(
            //@ts-ignore
            BigInt(amount || "0"),
            tokenInfo?.decimals as number
          )
        ),
        symbol: tokenInfo?.tokenSymbol as string,
        value: BigInt(amount || "0"),
      };
      const data = {
        data: {
          forcePosition: forcePosition as string,
          legacyTitanHash: withdrawalHash as string,
          balanceBN: tokenBalanceData,
          parsedBalance: commafy(
            ethers.utils.formatUnits(
              //@ts-ignore
              BigInt(amount || "0"),
              tokenInfo?.decimals as number
            )
          ),
          parsedBalanceWithoutCommafied: commafy(
            ethers.utils.formatUnits(
              //@ts-ignore
              BigInt(amount || "0"),
              tokenInfo?.decimals as number
            ),
            tokenInfo?.decimals as number
          ).replaceAll(",", ""),
        },
        error: null,
        isLoading: false,
        isSuccess: true,
      };
      return data;
    }
    if (data) {
      return {
        data: {
          forcePosition: "",
          legacyTitanHash: "",
          balanceBN: data,
          parsedBalance: commafy(
            ethers.utils.formatUnits(
              //@ts-ignore
              typeof data.value === "bigint" ? data.value : "0",
              data.decimals as number
            )
          ),
          parsedBalanceWithoutCommafied: commafy(
            ethers.utils.formatUnits(
              //@ts-ignore
              typeof data.value === "bigint" ? data.value : "0",
              data.decimals as number
            ),
            data.decimals as number
          ).replaceAll(",", ""),
        },
        error,
        isLoading,
        isSuccess,
      };
    }
    return null;
  }, [
    accountAddress,
    data,
    chainName,
    tokenInfo?.address,
    gb,
    forcePosition,
    modalOpen,
  ]);

  return tokenBalance;
}
