import { TokenInfo } from "types/token/supportedToken";
import { Box, Button, Flex, Text, TextProps, useTheme } from "@chakra-ui/react";
import { TokenSymbol } from "../image/TokenSymbol";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRecoilState } from "recoil";
import {
  selectedInTokenStatus,
  selectedOutTokenStatus,
} from "@/recoil/bridgeSwap/atom";
import useTokenBalance from "@/hooks/contracts/balance/useTokenBalance";
import useAddTokenToStorage from "@/hooks/storage/useAddTokenToStorage";
import { isETH } from "@/utils/token/isETH";
import useMediaView from "@/hooks/mediaView/useMediaView";
import "@fontsource/quicksand/500.css";
import { useGetMarketPrice } from "@/hooks/price/useGetMarketPrice";
import { useAmountOut } from "@/hooks/swap/useSwapTokens";
import { trimAmount } from "@/utils/trim";
import { useGetMode } from "@/hooks/mode/useGetMode";
import { ethers } from "ethers";
import { tokenColor } from "@/utils/carousel/tokenColorCode";
import {
  BALANCE_FONT_SIZE,
  FONT_SIZE,
  ICON_SIZE,
  LINE_STYLE,
  PADDING_SIZE,
} from "@/constant/carousel";
import Warning from "assets/icons/white_warning.svg";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  IsSearchToken,
  searchTokenStatus,
} from "@/recoil/card/selectCard/searchToken";

type TokenCardProps = {
  tokenInfo: TokenInfo & { isNew?: boolean };
  level?: number;
  isNew?: boolean;
  forBridge?: boolean;
  isPrice?: boolean;
  inNetwork?: boolean;
  hasInput?: boolean;
  isInput?: boolean;
  requireCall?: boolean;
  watch?: boolean;
  isDark?: boolean;
  isHover?: number | null;
  onClick?: (e: any) => any;
  w?: string | number;
  h?: string | number;
  style?: {};
  symbolSize?: {
    w: number;
    h: number;
  };
};

const TopLine = (props: { layer: number; notAdded: boolean }) => {
  const [isTokenSearch, setTokenSearch] = useRecoilState(IsSearchToken);
  return (
    <Box
      w={"332px"}
      h={"231.17px"}
      top={"-40px"}
      left={"-40px"}
      opacity={props.notAdded ? 0.1 : 1}
      pos={"absolute"}
    >
      <Box
        as={motion.div}
        w={"344px"}
        h={`${LINE_STYLE[props.layer]?.thin.height || 4.6}px`}
        transform={"rotate(-30deg)"}
        bg={"rgba(255, 255, 255, 0.5)"}
        position={"relative"}
        initial={{ top: `${LINE_STYLE[props.layer]?.thin.marginTop || 40}px` }}
        animate={{ top: `${LINE_STYLE[props.layer]?.thin.marginTop || 40}px` }}
        transition={`${isTokenSearch ? 0.1 : 0.5} linear`}
      ></Box>
      <Box
        as={motion.div}
        w={"344px"}
        h={`${LINE_STYLE[props.layer]?.thick.height || 46.6}px`}
        left={"2.26px"}
        transform={"rotate(-30deg)"}
        bg={
          "linear-gradient(180deg, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0) 100%)"
        }
        pos={"relative"}
        initial={{ top: `${LINE_STYLE[props.layer]?.thick.marginTop || 48}px` }}
        animate={{ top: `${LINE_STYLE[props.layer]?.thick.marginTop || 48}px` }}
        transition={`${isTokenSearch ? 0.1 : 0.5} linear`}
      ></Box>
    </Box>
  );
};

const TokenTitle = (props: {
  tokenName: String;
  isName: boolean;
  style?: TextProps;
}) => {
  const [isTokenSearch, setTokenSearch] = useRecoilState(IsSearchToken);

  return (
    <Text
      as={motion.span}
      fontWeight={props.isName ? 700 : 400}
      color={"#222222"}
      lineHeight={props?.isName ? props.style?.fontSize : ""}
      zIndex={100}
      {...props.style}
      initial={{ fontSize: props.style?.fontSize }}
      animate={{ fontSize: props.style?.fontSize }}
      transition={`${isTokenSearch ? 0.1 : 0.5} linear`}
    >
      {props.tokenName}
    </Text>
  );
};

export default function TokenCard(props: TokenCardProps) {
  const {
    tokenInfo,
    isNew,
    forBridge,
    isPrice,
    isInput,
    requireCall,
    watch,
    onClick,
    isHover,
    level,
    isDark,
    h,
    hasInput,
    inNetwork,
    style,
    symbolSize,
    w,
  } = props;

  const layer = Math.abs(level ?? 3);
  const [agreeToAdd, setAgreeToAdd] = useState<boolean>(false);

  const tokenData = useTokenBalance(tokenInfo, requireCall, watch);
  const thisTokenIsETH = isETH(tokenInfo);
  const theme = useTheme();
  const [, setSearchToken] = useRecoilState(searchTokenStatus);

  const { addNewToken } = useAddTokenToStorage();
  const notAdded = isNew && agreeToAdd === false;
  const addNewCard = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      addNewToken(tokenInfo);
      return setAgreeToAdd(true);
    },
    [agreeToAdd]
  );
  const cancelAddNewCard = (event: React.MouseEvent<HTMLParagraphElement>) => {
    event.stopPropagation();
    setSearchToken(null);
  };

  const [inTokenInfo] = useRecoilState(selectedInTokenStatus);
  const [outTokenInfo, setOutTokenInfo] = useRecoilState(
    selectedOutTokenStatus
  );
  const { amountOut } = useAmountOut();

  const { tokenPriceWithAmount: inTokenWithPrice } = useGetMarketPrice({
    //make it not able to fetch when token is not defined
    tokenName: isPrice ? (inTokenInfo?.tokenName as string) : undefined,
    amount: Number(inTokenInfo?.parsedAmount?.replaceAll(",", "")),
  });

  const { mobileView } = useMediaView();
  const { mode } = useGetMode();

  const pcView = window.matchMedia("(min-width: 1200px)").matches;
  const [isTokenSearch, setTokenSearch] = useRecoilState(IsSearchToken);

  const outAmount = useMemo(() => {
    if (
      (mode === "Wrap" ||
        mode === "Unwrap" ||
        mode === "ETH-Wrap" ||
        mode === "ETH-Unwrap") &&
      inTokenInfo?.parsedAmount
    ) {
      return inTokenInfo.parsedAmount;
    }
    return amountOut;
  }, [mode, inTokenInfo, amountOut]);

  const { tokenPriceWithAmount: outTokenWithPrice } = useGetMarketPrice({
    //make it not able to fetch when token is not defined
    tokenName: isPrice ? (outTokenInfo?.tokenName as string) : undefined,
    amount: Number(outAmount),
  });

  useEffect(() => {
    if (mode === "Pool") return;
    if (!isInput && outTokenInfo && amountOut && mobileView) {
      const value: string = amountOut;
      if (value === "" || value === null) {
        return setOutTokenInfo({
          ...outTokenInfo,
          amountBN: null,
          parsedAmount: null,
        });
      }

      // 데시말 초과 버그 수정
      const roundedValue = Number(value).toFixed(outTokenInfo.decimals);
      const parsedAmount = ethers.utils.parseUnits(
        roundedValue,
        outTokenInfo.decimals
      );
      ////////////////////

      return setOutTokenInfo({
        ...outTokenInfo,
        amountBN: parsedAmount.toBigInt(),
        parsedAmount: value,
      });
    }
  }, [amountOut, mode]);
  return (
    <Flex
      bg={
        notAdded
          ? "#383b44"
          : `linear-gradient(0deg, rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.1)), linear-gradient(0deg, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.8)), ${tokenColor(
              tokenInfo?.tokenSymbol
            )};`
      }
      w={typeof w === "string" ? w : `${w ? w + "px" : "100%"}`}
      h={typeof h === "string" ? h : `${h ? h + "px" : "100%"}`}
      opacity={
        isNew || isDark
          ? 1
          : isHover === undefined || isHover === null || isHover === level
          ? 0.9
          : 0.5
      }
      {...style}
      overflow={"hidden"}
      pos={"relative"}
      borderRadius={"16px"}
    >
      <Flex
        as={motion.div}
        w={"100%"}
        h={"100%"}
        borderRadius={"16px"}
        border={`${layer === 0 ? 4 : 3}px solid ${
          notAdded ? "#292f45" : tokenColor(tokenInfo?.tokenSymbol)
        }`}
        pos={"relative"}
        flexDir={"column"}
        justifyContent={"space-between"}
        cursor={"pointer"}
        boxSizing={"border-box"}
        onClick={notAdded ? () => {} : onClick}
        fontFamily={theme.fonts.Quicksand}
        initial={{
          padding: `${
            notAdded ? 19 : PADDING_SIZE[layer] || (pcView ? 16 : 8)
          }px`,
        }}
        animate={{
          padding: `${
            notAdded ? 19 : PADDING_SIZE[layer] || (pcView ? 16 : 8)
          }px`,
        }}
        transition={`${isTokenSearch ? 0.1 : 0.5} linear`}
      >
        <TopLine layer={layer} notAdded={notAdded ? true : false} />
        {notAdded ? (
          <Flex flexDirection={"column"}>
            <Flex
              w={"100%"}
              justifyContent={"space-between"}
              alignItems={"end"}
            >
              <TokenTitle
                tokenName={
                  thisTokenIsETH
                    ? "Ethereum"
                    : tokenInfo?.tokenSymbol === "WETH"
                    ? "Wrapped Ethereum"
                    : tokenInfo?.tokenName === "Tokamak Network Token"
                    ? "Tokamak Network"
                    : tokenInfo?.tokenName ?? "TOKEN"
                }
                isName={true}
                style={{
                  fontSize: `${FONT_SIZE[layer]?.name ?? 18}px`,
                  color: "#ffffff",
                }}
              />
              <Flex
                p={"8px 10px"}
                fontSize={"16px"}
                bg={"#1F2128"}
                color={"#fff"}
                borderRadius={"6px"}
                zIndex={100}
                gap={"4px"}
                width={"74px"}
                fontWeight={600}
                opacity={0.5}
                justifyContent={"center"}
                alignItems={"center"}
                height={"32px"}
              >
                Add
                <Image src={Warning} alt="warning" />
              </Flex>
            </Flex>
            <Flex>
              <TokenTitle
                tokenName={tokenInfo?.tokenSymbol ?? "TOK"}
                isName={false}
                style={{
                  fontSize: `${FONT_SIZE[layer]?.symbol ?? 14}px`,
                  color: "#ffffff",
                }}
              />
            </Flex>
          </Flex>
        ) : (
          <>
            {pcView && (
              <Flex justifyContent={"space-between"} w={"100%"} gap={"10px"}>
                <TokenTitle
                  tokenName={
                    thisTokenIsETH
                      ? "Ethereum"
                      : tokenInfo?.tokenSymbol === "WETH"
                      ? "Wrapped Ethereum"
                      : tokenInfo?.tokenName === "Tokamak Network Token"
                      ? "Tokamak Network"
                      : tokenInfo?.tokenName ?? "TOKEN"
                  }
                  isName={true}
                  style={{
                    fontSize: `${FONT_SIZE[layer]?.name ?? 18}px`,
                    lineHeight: `${24 - 2 * layer}px`,
                  }}
                />
                <TokenTitle
                  tokenName={tokenInfo?.tokenSymbol ?? "TOK"}
                  isName={false}
                  style={{
                    fontSize: `${FONT_SIZE[layer]?.symbol ?? 14}px`,
                  }}
                />
              </Flex>
            )}
            {!pcView && (
              <Flex
                flexDir={"column"}
                justifyContent={"space-between"}
                w={"100%"}
                color={"#222222"}
              >
                <Text fontWeight={700} fontSize={16} zIndex={100}>
                  {tokenInfo?.tokenSymbol ?? "TOK"}
                </Text>
                <Text fontWeight={700} fontSize={10} zIndex={100}>
                  {thisTokenIsETH
                    ? "Ethereum"
                    : tokenInfo?.tokenSymbol === "WETH"
                    ? "Wrapped Ethereum"
                    : tokenInfo?.tokenName ?? "TOKEN"}
                </Text>
              </Flex>
            )}
          </>
        )}

        {!notAdded && (
          <Flex
            as={motion.div}
            justifyContent={"center"}
            pos={"absolute"}
            h={"100%"}
            w={"100%"}
            alignItems={notAdded ? "baseline" : "center"}
            initial={{
              marginLeft: `-${PADDING_SIZE[layer] ?? (pcView ? 16 : 8)}px`,
              marginTop: `-${PADDING_SIZE[layer] ?? (pcView ? 16 : 8)}px`,
            }}
            animate={{
              marginLeft: `-${PADDING_SIZE[layer] ?? (pcView ? 16 : 8)}px`,
              marginTop: `-${PADDING_SIZE[layer] ?? (pcView ? 16 : 8)}px`,
            }}
            transition={`${isTokenSearch ? 0.1 : 0.5} linear`}
          >
            <TokenSymbol
              w={
                (symbolSize ? symbolSize?.w : ICON_SIZE[layer]) ??
                (notAdded ? 40 : 92)
              }
              h={
                (symbolSize ? symbolSize?.h : ICON_SIZE[layer]) ??
                (notAdded ? 40 : 92)
              }
              tokenType={tokenInfo?.tokenSymbol}
            />
          </Flex>
        )}
        {notAdded ? (
          <Flex flexDir={"column"} alignItems={"center"}>
            <Text
              fontSize={"14px"}
              textAlign={"center"}
              fontStyle={"normal"}
              fontWeight={400}
              lineHeight={"normal"}
              color={"#fff"}
              w={"216px"}
            >
              This token isn’t traded on leading U.S. centralized exchanges or
              frequently swapped on Tokamak Network. Always conduct your own
              research before trading.
            </Text>
            <Button
              w={"100%"}
              h={"48px"}
              my={"20px"}
              bg={"#030303"}
              _hover={{}}
              _active={{}}
              fontSize={16}
              bgColor={"#007AFF"}
              fontWeight={600}
              onClick={addNewCard}
            >
              I Understand
            </Button>

            <Text
              fontSize={16}
              fontWeight={400}
              color={"#fff"}
              onClick={cancelAddNewCard}
            >
              Cancel
            </Text>
          </Flex>
        ) : forBridge ? (
          pcView ? (
            <Flex flexDir={"column"} rowGap={"13px"}>
              <Flex fontSize={16} color={"#222222"} columnGap={"2px"}>
                <Text fontWeight={500}>Balance: </Text>
                <Text fontWeight={700}>
                  {trimAmount(
                    tokenData?.data.parsedBalanceWithoutCommafied,
                    9
                  ) || "0.0"}
                </Text>
              </Flex>
            </Flex>
          ) : (
            <Flex flexDir={"column"}>
              <Flex fontSize={12} color={"#222222"}>
                <Text fontWeight={500}>Balance </Text>
              </Flex>
              <Text fontWeight={700} fontSize={18} color={"#222222"}>
                {trimAmount(tokenData?.data.parsedBalanceWithoutCommafied, 9)}
              </Text>
            </Flex>
          )
        ) : (
          <Flex flexDir={"column"} color={"#222"}>
            {!isPrice && (
              <>
                {pcView ? (
                  <>
                    <Text
                      as={motion.span}
                      fontWeight={400}
                      initial={{
                        fontSize: `${BALANCE_FONT_SIZE[layer]?.title ?? 16}px`,
                      }}
                      animate={{
                        fontSize: `${BALANCE_FONT_SIZE[layer]?.title ?? 16}px`,
                      }}
                      transition={`${isTokenSearch ? 0.1 : 0.5} linear`}
                    >
                      balance:{""}
                    </Text>
                    <Text
                      as={motion.span}
                      fontWeight={700}
                      initial={{
                        fontSize: `${BALANCE_FONT_SIZE[layer]?.value ?? 16}px`,
                      }}
                      animate={{
                        fontSize: `${BALANCE_FONT_SIZE[layer]?.value ?? 16}px`,
                      }}
                      transition={`${isTokenSearch ? 0.1 : 0.5} linear`}
                    >
                      {trimAmount(
                        tokenData?.data.parsedBalanceWithoutCommafied,
                        9
                      ) || "0.0"}
                    </Text>
                  </>
                ) : (
                  <Text fontWeight={700} fontSize={18}>
                    {trimAmount(tokenData?.data.parsedBalance, 9) || "0.0"}
                  </Text>
                )}
              </>
            )}

            {isPrice && (
              <Flex flexDir={"column"} rowGap={0}>
                <Text
                  h={"28px"}
                  fontFamily={theme.fonts.Quicksand}
                  fontWeight={700}
                  fontSize={22}
                  textOverflow={"hidden"}
                >
                  {isInput
                    ? trimAmount(inTokenInfo?.parsedAmount, 9) || "0"
                    : trimAmount(outAmount, 9) || "0"}
                </Text>
                <Text
                  fontFamily={theme.fonts.Quicksand}
                  fontWeight={700}
                  fontSize={10}
                >
                  $
                  {isInput ? inTokenWithPrice || "0" : outTokenWithPrice || "0"}
                </Text>
              </Flex>
            )}
          </Flex>
        )}
      </Flex>
    </Flex>
  );
}
