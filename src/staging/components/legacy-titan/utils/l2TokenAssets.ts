import { LegacyTitanTokenData } from "@/staging/types/legacyTitan";

export const findTokenAmount = (
  l1Token: string,
  l2Token: string,
  claimer: string,
  chainName: "mainnet" | "sepolia"
): LegacyTitanTokenData | null => {
  const tokenData = require(`./../../../constants/legacy-titan-assets/${chainName}.json`);

  const l1TokenLower = l1Token?.toLowerCase();
  const l2TokenLower = l2Token?.toLowerCase();
  const claimerLower = claimer?.toLowerCase();
  const tokenEntry = tokenData.find(
    (entry: any) =>
      entry.l1Token.toLowerCase() === l1TokenLower &&
      entry.l2Token.toLowerCase() === l2TokenLower
  );

  if (!tokenEntry) {
    return null;
  }

  const claimerData = tokenEntry.data.find(
    (data: any) => data.claimer.toLowerCase() === claimerLower
  );
  return {
    l1Token: tokenEntry?.l1Token,
    l2Token: tokenEntry?.l2Token,
    tokenName: tokenEntry?.tokenName,
    data: claimerData,
  };
};
