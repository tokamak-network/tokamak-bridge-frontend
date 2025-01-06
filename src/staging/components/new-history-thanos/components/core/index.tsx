import React, { useCallback, useEffect, useMemo } from "react";
import { Flex, Box, Text } from "@chakra-ui/react";
import {
  Action,
  CT_ACTION,
  CT_PROVIDE,
  CT_REQUEST,
  CT_REQUEST_CANCEL,
  isDepositTransactionHistory,
  isWithdrawTransactionHistory,
  Status,
} from "@/staging/types/transaction";
import Pending from "@/staging/components/new-history-thanos/components/core/pending";
import Complete from "@/staging/components/new-history-thanos/components/core/complete";
import LegacyPending from "@/staging/components/new-history/components/core/pending";
import LegacyComplete from "@/staging/components/new-history/components/core/complete";
import { useRecoilState, useRecoilValue } from "recoil";
import { selectedTransactionCategory } from "@/recoil/history/transaction";
import GradientSpinner from "@/components/ui/GradientSpinner";
import Image from "next/image";
import NoAcitivity from "@/assets/icons/accountHistory/noActivityIcon.svg";
import LoadingTx from "@/components/history/LoadingTx";
import { pendingTransactionHashes } from "@/recoil/modal/atom";
import { getBridgeL2ChainId } from "@/staging/components/new-confirm/utils";
import { isThanosChain } from "@/utils/network/checkNetwork";
import { useBridgeHistory } from "@/staging/hooks/bridge/useBridgeHistory";
import { NoHistoryComponent } from "./NoHistoryComponent";
import { TransactionHistoryBanner } from "./TransactionHistoryBanner";
import NoHistoryIcon from "@/assets/icons/no_history_warning.svg";

const NoAcitivityComponent = () => {
  return (
    <Flex
      flexDir={"column"}
      rowGap={"24px"}
      alignItems={"center"}
      justifyContent={"center"}
      h={"100%"}
    >
      <Image src={NoHistoryIcon} alt={"noActivityIcon"}></Image>
      <Text color={"#E3F3FF"}>History is not supported anymore.</Text>
    </Flex>
  );
};

const LoadingSpinner = () => {
  const components = new Array(4)
    .fill(null)
    .map((_, index) => <LoadingTx key={index} />);

  return <>{components}</>;
};

export default function AccountHistoryNew() {
  const { withdrawHistory } = useBridgeHistory();
  const _selectedTransactionCategory = useRecoilValue(
    selectedTransactionCategory
  );
  const historyData = useMemo(() => {
    switch (_selectedTransactionCategory) {
      case Action.Deposit:
        return undefined;
      case Action.Withdraw:
        return withdrawHistory;
      case CT_ACTION.REQUEST:
        return undefined;
      case CT_ACTION.PROVIDE:
        return undefined;
      default:
        return;
    }
  }, [_selectedTransactionCategory, withdrawHistory]);
  return (
    <Flex flexDir={"column"} gap={"6px"} h={"100%"} width={"100%"}>
      {_selectedTransactionCategory === Action.Withdraw && (
        <TransactionHistoryBanner />
      )}
      <Flex flexDirection="column" gap="2" h={"100%"}>
        {historyData === undefined && <NoHistoryComponent />}
        {historyData === null && <LoadingSpinner />}
        {historyData?.length === 0 && <NoAcitivityComponent />}
        {historyData?.map((transaction, index) => {
          const isCompleted = transaction.status === Status.Completed;
          const key =
            isDepositTransactionHistory(transaction) ||
            isWithdrawTransactionHistory(transaction)
              ? transaction.transactionHashes.initialTransactionHash
              : index;
          const l2ChainId = getBridgeL2ChainId(transaction);
          return (
            <Box
              key={`${transaction.action}-${key}`}
              w={"336px"}
              px={"12px"}
              py={isCompleted ? "6px" : "8px"}
              borderRadius={"8px"}
              border={isCompleted ? "none" : "1px solid #313442"}
              bg={"#15161D"}
            >
              {/** In the history, Pending shows the current incomplete screen, and Complete shows the completed screen. */}
              {isCompleted ? (
                <LegacyComplete {...transaction} />
              ) : (
                <LegacyPending transaction={transaction} />
              )}
            </Box>
          );
        })}
      </Flex>
    </Flex>
  );
}
