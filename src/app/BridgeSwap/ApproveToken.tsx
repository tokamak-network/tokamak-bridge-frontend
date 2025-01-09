import useBridgeSupport from "@/hooks/bridge/useBridgeSupport";
import { useGetMode } from "@/hooks/mode/useGetMode";
import { useApprove } from "@/hooks/token/useApproval";
import { useInOutTokens } from "@/hooks/token/useInOutTokens";
import useIsTon from "@/hooks/token/useIsTon";
// import { useTransaction } from "@/hooks/tx/useTx";
import Image from "next/image";
import { Button, Flex, Spinner, Text } from "@chakra-ui/react";
import { useAccount } from "wagmi";
import { accountDrawerStatus } from "@/recoil/modal/atom";
import { useRecoilState } from "recoil";
import { capitalizeFirstChar } from "@/utils/trim/capitalizeChar";
import useInputBalanceCheck from "@/hooks/token/useInputCheck";
import { useTransaction } from "@/hooks/tx/useTx";
import ConfirmedImage from "assets/icons/confirm/success.svg";
import commafy from "@/utils/trim/commafy";
import { ethers } from "ethers";
import { useMemo } from "react";
import CustomTooltip, {
  CustomTooltipWithQuestion,
} from "@/components/tooltip/CustomTooltip";
import QuestionIcon from "assets/icons/question.svg";

export default function ApproveToken() {
  const { inToken } = useInOutTokens();
  const { isApproved, callApprove, isLoading, isRevokeForUSDT } = useApprove();
  const { isNotSupportForBridge } = useBridgeSupport();
  const { isTONatPair } = useIsTon();
  const { mode } = useGetMode();
  const { isConnected } = useAccount();
  const { isBalanceOver, isInputZero } = useInputBalanceCheck();
  const { confirmedApproveTransaction, confirmedRevokeTransaction } =
    useTransaction();
  const [, setIsDrawerOpen] = useRecoilState(accountDrawerStatus);

  if (
    (isApproved ||
      mode === "Withdraw" ||
      isNotSupportForBridge ||
      !inToken ||
      (mode == "Swap" && isTONatPair) ||
      !isConnected ||
      isBalanceOver ||
      isInputZero) &&
    (confirmedApproveTransaction === undefined ||
      confirmedApproveTransaction?.tokenData?.[0]?.tokenAddress.toLowerCase() !==
        inToken?.tokenAddress.toLowerCase() ||
      isInputZero)
  ) {
    return null;
  }

  const parsedAmount =
    confirmedApproveTransaction?.tokenData?.[0]?.amount?.toString()
      ? ethers.utils.formatUnits(
          confirmedApproveTransaction.tokenData[0].amount.toString(),
          inToken?.token.decimals
        )
      : "-";

  const text =
    confirmedApproveTransaction && isApproved
      ? `${commafy(parsedAmount, 4)} ${inToken?.tokenSymbol} has been approved`
      : `${isRevokeForUSDT ? "Revoke" : "Approve"} ${
          inToken?.tokenSymbol
        } for ${capitalizeFirstChar(mode ?? undefined)}`;

  const afterApproved = isApproved && confirmedApproveTransaction;
  const beforeApproved = !isLoading && !afterApproved;

  return (
    <Flex
      w={"100%"}
      // h={isExpanded ? "310px" : "48px"}
      maxH={"48px"}
      bg={"#1f2128"}
      borderRadius={"8px"}
      borderWidth={beforeApproved ? "1px" : ""}
      borderColor={"#59628D"}
      px={"20px"}
      py={"19px"}
      justifyContent={"space-between"}
      alignItems={"center"}
      color={isLoading ? "#8E8E92" : ""}
    >
      <Flex columnGap={"12px"} alignItems={"center"}>
        <Text
          fontSize={{ base: 12, lg: 14 }}
          color={isLoading ? "#A0A3AD" : "#fff"}
        >
          {text}
        </Text>
        {isRevokeForUSDT && !isApproved && (
          <Flex ml={"-5px"}>
            <CustomTooltipWithQuestion
              isGrayIcon={true}
              tooltipLabel={
                <Flex
                  w={"240px"}
                  h={"45px"}
                  fontSize={11}
                  textAlign={"center"}
                  alignItems={"center"}
                  justifyContent={"center"}
                >
                  {
                    <span>
                      Approval for USDT must be revoked first <br />
                      before a new amount is approved.
                    </span>
                  }
                </Flex>
              }
              style={{ px: "-5px", tooltipLineHeight: "15x", height: "45px" }}
            ></CustomTooltipWithQuestion>
          </Flex>
        )}
      </Flex>
      {isLoading && !isRevokeForUSDT ? (
        <Spinner w={"24px"} h={"24px"} color={"#007AFF"} />
      ) : afterApproved ? (
        <Flex>
          <Image src={ConfirmedImage} alt={"ConfirmedImage"} />
        </Flex>
      ) : (
        <Flex>
          {(isRevokeForUSDT || confirmedRevokeTransaction) && (
            <Button
              w={{ base: "64px", lg: "96px" }}
              h={"28px"}
              fontSize={{ base: 12, lg: 14 }}
              fontWeight={500}
              bgColor={"#007AFF"}
              color={"#fff"}
              _active={{}}
              _hover={{}}
              onClick={() => {
                callApprove();
                setIsDrawerOpen(false);
              }}
              isDisabled={!isRevokeForUSDT || isLoading}
              _disabled={{ bg: "#15161D", color: "#8E8E92" }}
              opacity={"1 !important"}
              cursor={"pointer !important"}
            >
              {"Revoke"}
              {isLoading && isRevokeForUSDT && (
                <Flex w={"20px"} h={"20px"} ml={"6px"}>
                  <Spinner
                    w={"20px"}
                    h={"20px"}
                    maxW={"20px"}
                    maxH={"20px"}
                    color={"#007AFF"}
                  />
                </Flex>
              )}
              {confirmedRevokeTransaction && (
                <Flex ml={"6px"} minW={"18px"} minH={"18px"}>
                  <Image src={ConfirmedImage} alt={"ConfirmedImage"} />
                </Flex>
              )}
            </Button>
          )}
          <Button
            w={{ base: "64px", lg: isRevokeForUSDT ? "80px" : "92px" }}
            h={"28px"}
            ml={"12px"}
            fontSize={{ base: 12, lg: 14 }}
            fontWeight={500}
            bgColor={"#007AFF"}
            color={"#fff"}
            _active={{}}
            _hover={{}}
            onClick={() => {
              callApprove();
              setIsDrawerOpen(false);
            }}
            isDisabled={isLoading || isRevokeForUSDT}
            _disabled={{ bg: "#15161D", color: "#8E8E92" }}
            cursor={"pointer !important"}
            opacity={"1 !important"}
          >
            {"Approve"}
          </Button>
        </Flex>
      )}
    </Flex>
  );
}
